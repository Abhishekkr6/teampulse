
# Example Flow: Push event → Metrics → Frontend update

This doc explains a concrete example end-to-end sequence (with timestamps and job ids) so implementers can test and verify.

---

## Scenario

Developer pushes commits to `owner/repo`. We want TeamPulse to display updated commit heatmap and update per-developer activity index within ~30–120 seconds.

---

## Step-by-step (example timeline)

**T0 = 2025-11-19T10:00:00Z**

1. Developer pushes commit(s) to `owner/repo`.
2. GitHub POSTs to `/api/v1/webhooks/github` with `push` event. Header: `x-github-delivery: abc-123`

**T0+100ms**

3. Backend receives request.
  - Verifies signature (HMAC) using saved webhook secret.
  - Parses payload.
  - For each commit in payload:
    - Upsert commit into `commits` collection (fields: sha, repoId, authorGithubId, message, timestamp, files count).
  - Creates `commit-processing` job:
    - **JobId:** `commit-processing:repo_<repoId>:20251119T100000Z`
    - **Payload:** `{ "repoId": "<repoId>", "commitIds": ["<commitId1>", "<commitId2>"], "receivedAt":"2025-11-19T10:00:00Z" }`
  - Responds `200 OK` to GitHub.

**T0+2s**

4. BullMQ picks the `commit-processing` job.
  - Worker fetches commit documents by commitIds.
  - For each commit, worker fetches file list (if available from payload or via GitHub API if needed).
  - Worker computes `modulePaths` (e.g., `["src","tests"]`).
  - Worker updates `commits` docs: set `modulePaths` and `processed=true`.

**T0+5s**

5. Worker updates per-developer ephemeral counters (in Redis) and stores a partial metric record or pushes `metrics` job for aggregation.
  - Example: increments `org:<orgId>:dev:<githubId>:commits:2025-11-19` counter.

**T0+10s**

6. Worker inserts a `metrics_snapshots` draft (or signals to `metrics` queue):
```json
{
  "orgId": "<orgId>",
  "repoId": "<repoId>",
  "metricName": "recent_commits",
  "metricValue": 3,
  "timeframeStart": "2025-11-19T00:00:00Z",
  "timeframeEnd": "2025-11-20T00:00:00Z",
  "payload": { "byAuthor": { "alice": 2, "bob": 1 } }
}
```

**T0+12s**

7. Worker publishes Redis pubsub event:
```json
{ "type": "COMMITS_UPDATED", "orgId": "<orgId>", "repoId":"<repoId>", "payload": { "commitCount": 3 } }
```

**T0+13s**

8. Backend (subscribed to Redis channel) receives event and emits socket event to frontend clients in room org:<orgId> — event name commits:update.

**T0+15s**

9. Frontend receives commits:update socket event and:
  - Fetches GET /api/v1/orgs/:orgId/dashboard?from=...&to=... OR uses payload to update local charts.
  - Commit heatmap and activity cards refresh.

---

## Outcome

User sees updated metrics within ~15 seconds of push. Heavy aggregation can be scheduled or batched by metrics worker for daily/ hourly snapshots.

---

## Failure & Retry Notes

If worker fails processing job:

- BullMQ will retry (3 attempts default).
- On repeated failure job moves to dead-letter.
- Backend logs and an alert job is created for manual inspection.

---

## Testing checklist (for implementers)

- Simulate a push webhook (use GitHub UI or curl with proper HMAC).
- Verify commit docs created.
- Verify commit-processing job created in queue.
- Verify metrics_snapshots updated.
- Verify Redis pubsub message emitted and frontend receives socket event.
- Verify frontend updates charts.

---
