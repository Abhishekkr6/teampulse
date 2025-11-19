
# Webhooks — Ingestion Spec (GitHub)

## Overview

TeamPulse ingests Git events via webhooks. Webhook handlers must be lightweight: verify signature, persist minimal normalized record, enqueue jobs for heavy processing, and respond quickly (`200 OK`).

---

## Endpoint

**POST** `/api/v1/webhooks/github`

**Headers:**

- `x-hub-signature-256` (HMAC SHA-256) — GitHub
- `x-github-event` — event type
- `x-github-delivery` — unique delivery id

**Body:** Raw JSON payload (do not parse before signature verification).

---

## Verification (HMAC)

1. For each repo we store `webhookSecretHash` (hash of secret). For verification:
   - Retrieve repo by `owner/repo` from payload or from route config.
   - Use the stored secret (or keep secret in env for auto-registered webhooks).
2. Compute `signature = "sha256=" + HMAC_SHA256(secret, rawBody)`
3. Compare `signature` and header value using timing-safe compare.
4. If mismatch → return `401`.

**Important:** We must compute HMAC using raw body bytes; middleware must expose rawBody.

---

## Supported Events & Primary DB actions

### `push`

- **Action:** for each commit in payload:
  - Upsert commit into `commits` (`sha`, `message`, `author`, `timestamp`, `filesChangedCount`, additions, deletions, modulePaths left empty initially).
  - Create a `commit-processing` job with payload `{ repoId, commitIds }`.
- **Quick response:** `200 OK`

### `pull_request` (opened, synchronize, reopened, closed, merged)

- **Action:** upsert `pull_requests` doc with latest fields.
- **If action in ["opened","synchronize","reopened"]:**
  - Enqueue `pr-analysis` job `{ prId, repoId, trigger: 'webhook', payloadMeta }`.
- **If merged/closed:** update PR state and trigger `pr-analysis` job for final metrics.

### `issues`

- **Action:** upsert `issues` collection; if `closed` mark closedAt.

### `pull_request_review` / `pull_request_review_comment`

- **Action:** update `pull_requests` reviewers/respondedAt and commentsCount; enqueue `pr-analysis` if needed.

---

## Idempotency

- Use provider `x-github-delivery` and provider event id for dedupe.
- For upserts use `providerPrId`, `sha` as unique keys.

---

## Payload to Queues (example)

After persisting minimal records, enqueue jobs:

**commit-processing:**
```json
{ "repoId": "<ObjectId>", "commitIds": ["<ObjectId>",...], "receivedAt": "..." }
```

**pr-analysis:**
```json
{ "prId": "<ObjectId>", "repoId": "<ObjectId>", "trigger": "webhook", "payloadMeta": { "action": "synchronize" } }
```

---

## Notes

- Worker IDs must be deterministic if possible.
- Use small payloads referencing DB ids, not full objects.

---

## Security & Best Practices

- Keep webhook secret per repo; hash at rest.
- Limit accepted event types via repo config.
- Log only metadata for raw payloads (avoid keeping full payloads long-term).
- Rate-limit incoming webhooks & apply backoff on repeated failures.
- Provide an endpoint for "test webhook" and "last webhook delivery status" in repo settings.

---

## Example flow (push event)

1. GitHub POST `/api/v1/webhooks/github` with push payload.
2. Backend verifies signature.
3. Backend persists commits (sha, msg, author, timestamp).
4. Backend enqueues commit-processing job with commitIds.
5. Backend returns `200 OK`.
6. Worker consumes job, extracts modulePaths, updates commit docs, writes metrics snapshot.

---


