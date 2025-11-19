
# Jobs & Queues — Contracts & Responsibilities

Queues (BullMQ):

- `commit-processing`
- `pr-analysis`
- `metrics` (daily/hourly snapshots)
- `alerts`
- `dead-letter`

General rules:

- Jobs are idempotent.
- Use `attempts: 3` with exponential backoff.
- Use unique jobId pattern where applicable: `<type>:<repoId>:<isoTime>`.

---

## 1) commit-processing

**Queue name:** `commit-processing`

**Job payload:**
```json
{
  "repoId": "<ObjectId>",
  "commitIds": ["<commitObjectId>", "..."],
  "receivedAt": "2025-11-19T10:00:00Z"
}
```

**Worker actions:**

- For each commitId:
  - Fetch commit doc.
  - Read commit file list (from provider or stored raw) → compute modulePaths as first-level folders.
  - Update commits[modulePaths] and set processed=true.
  - Increment per-author counters for timeframe.
  - Optionally emit partial metrics into metrics queue or write to metrics_snapshots.

Result: commit docs updated, metrics partial written.

---

## 2) pr-analysis

**Queue name:** `pr-analysis`

**Job payload:**
```json
{
  "prId": "<ObjectId>",
  "repoId": "<ObjectId>",
  "trigger": "webhook" | "scheduled",
  "payloadMeta": { "event": "synchronize" }
}
```

**Worker actions:**

- Fetch PR doc with files changed, additions, deletions, reviewers, comments.
- Compute riskScore (algorithm in docs).
- Update PR document riskScore.
- If riskScore > org.threshold create alerts doc.
- Publish event to Redis pubsub for real-time frontend update.

Result: PR risk persisted; alerts if needed.

---

## 3) metrics (daily/hourly snapshots)

**Queue name:** `metrics`

**Job payload:**
```json
{ "orgId": "<ObjectId>", "timeframeStart":"2025-11-12T00:00:00Z", "timeframeEnd":"2025-11-19T00:00:00Z" }
```

**Worker actions:**

- For org: compute PI per dev using last N days data.
- Compute avg PR time, commits per dev, churn map.
- Write metrics_snapshots documents (one per metric).
- Optionally compute trends and insert summary metric.

Result: metrics snapshots for dashboards.

---

## 4) alerts

**Queue name:** `alerts`

**Job payload:**
```json
{ "orgId":"...", "check":"OVERLOAD"|"PR_STALE", "params": { } }
```

**Worker actions:**

- Run specific check across recent data.
- Create alerts documents for matches.
- Notify via Slack / webhooks / pubsub.

---

## 5) Dead letter & monitoring

- Failed jobs after attempts → dead-letter queue.
- Provide admin UI to inspect dead-letter entries.
- Log job execution time & errors (Sentry).

---

## 6) Example job options (BullMQ)

- attempts: 3
- backoff: { type: 'exponential', delay: 2000 }
- removeOnComplete: { age: 3600 }
- removeOnFail: false (keep failures until analyzed)

---

## 7) Contracts & Schema versioning

- Job payload shapes should include schemaVersion if evolving.
- Backward-compatible workers should handle unknown fields gracefully.

---
