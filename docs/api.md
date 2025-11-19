
# TeamPulse API (v1)

**Base path:** `/api/v1`

---

## Response Envelope

All responses follow this structure:

```json
{
  "success": true | false,
  "data": <any | null>,
  "error": <object | null>
}
```

**Error object:**
```json
{
  "code": "ERR_CODE",
  "message": "Human readable message",
  "details": {}
}
```

---

## Auth & User

### `GET /api/v1/auth/github/login`
- **Description:** Redirects user to GitHub OAuth.
- **Auth:** Public
- **Request:** None
- **Response:** Redirect to GitHub

---

### `GET /api/v1/auth/github/callback?code=&state=`
- **Description:** GitHub returns code. Exchange for token, create/update user, issue app JWT.
- **Auth:** Public
- **Behavior:** On success, redirect to frontend (or set cookie) with token.
- **Response:** Redirect or
    ```json
    {
      "success": true,
      "data": { "token": "<jwt>", "user": { ... } },
      "error": null
    }
    ```

---

### `GET /api/v1/me`
- **Description:** Get current user.
- **Auth:** Bearer JWT
- **Response:**
    ```json
    {
      "success": true,
      "data": { "id": "...", "githubId": "...", "name": "...", "role": "dev", "orgIds": ["..."] },
      "error": null
    }
    ```

---

## Organizations & Repos

### `POST /api/v1/orgs`
- **Auth:** Admin
- **Body:**
    ```json
    { "name": "Team Name", "slug": "team-slug" }
    ```
- **Response:** 201 Created org object

---

### `GET /api/v1/orgs/:orgId/repos`
- **Auth:** User in org
- **Response:** List of repo records

---

### `POST /api/v1/orgs/:orgId/repos/connect`
- **Auth:** Org admin/lead
- **Body:**
    ```json
    {
      "provider": "github",
      "providerRepoId": "123456",
      "webhookSecret": "xxxx" // optional if app auto-registers
    }
    ```
- **Behavior:** Persist repo, store webhook-secret hash (if provided), optionally auto-register webhook
- **Response:** Repo object

---

### `GET /api/v1/orgs/:orgId/repos/:repoId/status`
- **Auth:** Org member
- **Response:** Webhook + last-sync status

---

## Commits / PRs / Issues

### `GET /api/v1/repos/:repoId/commits?from=&to=&author=&page=&pageSize=`
- **Auth:** Org member
- **Response:**
    ```json
    {
      "success": true,
      "data": {
        "items": [{ "sha": "...", "message": "...", "authorGithubId": "...", "timestamp": "..." }],
        "page": 1, "pageSize": 25, "total": 200
      },
      "error": null
    }
    ```

---

### `GET /api/v1/repos/:repoId/prs?state=open&minRisk=0.5&page=1`
- **Auth:** Org member
- **Response:** List of PR objects including riskScore

---

### `GET /api/v1/repos/:repoId/issues?state=open`
- **Auth:** Org member
- **Response:** Issues list

---

## Metrics & Dashboard

### `GET /api/v1/orgs/:orgId/dashboard?from=&to=`
- **Auth:** Org member
- **Response:** Aggregated KPIs, timeseries, recent alerts
    ```json
    {
      "success": true,
      "data": {
        "kpis": { "activeDevs": 6, "commits": 120, "openPRs": 12, "avgPRTimeHours": 36 },
        "charts": {
          "commitsTimeseries": [ { "date": "2025-11-10", "count": 10 } ],
          "prLifecycle": [ ... ]
        },
        "alerts": [ /* recent alerts */ ]
      }
    }
    ```

---

### `GET /api/v1/metrics/org/:orgId?metric=weekly_pi&from=&to=`
- **Auth:** Org member
- **Response:** Metrics_snapshots entries for drilldowns

---

## Alerts

### `GET /api/v1/orgs/:orgId/alerts`
- **Auth:** Org member
- **Response:** Active & recent alerts

---

### `POST /api/v1/orgs/:orgId/alerts/:alertId/resolve`
- **Auth:** Required role (lead/admin)
- **Body:**
    ```json
    { "resolvedByUserId": "<userId>" }
    ```
- **Response:** Resolved alert object

---

## Webhooks (Ingest)

### `POST /api/v1/webhooks/github`
- **Auth:** Public (validate HMAC)
- **Headers:** `x-hub-signature-256` or provider signature header
- **Body:** Raw provider JSON
- **Behavior:** Verify signature → persist minimal normalized record → push job(s) to queues → return 200 OK quickly
- **Response:**
    ```json
    { "success": true, "data": null, "error": null }
    ```

---

## Health & Debug

### `GET /api/v1/health`
- **Response:**
    ```json
    { "success": true, "data": { "api": "ok", "db": "ok" }, "error": null }
    ```

---

## Notes

- Use pagination for list endpoints.
- Use RBAC checks for org-scoped resources.
- Keep write endpoints (webhook) fast — push background jobs instead of heavy processing.

---