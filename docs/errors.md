
# Standard Error Codes — TeamPulse API

All API errors return:
```json
{ "success": false, "data": null, "error": { "code":"...", "message":"...", "details": {} } }
```

---

## Common Error Codes

### ERR_AUTH
- **HTTP:** 401
- **Message:** "Authentication required"
- **When:** Missing/invalid JWT or token expired.

### ERR_FORBIDDEN
- **HTTP:** 403
- **Message:** "You do not have permission to perform this action"
- **When:** RBAC check failed.

### ERR_NOT_FOUND
- **HTTP:** 404
- **Message:** "Resource not found"
- **When:** repo/user/pr not found.

### ERR_VALIDATION
- **HTTP:** 400
- **Message:** "Invalid request data"
- **Details:** field-level errors

### ERR_RATE_LIMIT
- **HTTP:** 429
- **Message:** "Too many requests"
- **When:** API rate limiting triggered.

### ERR_WEBHOOK_INVALID_SIGNATURE
- **HTTP:** 401
- **Message:** "Invalid webhook signature"
- **When:** HMAC mismatch for webhook.

### ERR_INTERNAL
- **HTTP:** 500
- **Message:** "Internal server error"
- **When:** unexpected error. (Log and Sentry)

---

## Example Error Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERR_FORBIDDEN",
    "message": "You do not have permission to perform this action",
    "details": { "requiredRole": "lead" }
  }
}
```

---

## Implementation Notes

- Return minimal details to clients; log full stack trace to Sentry.
- Use consistent error factory helper to standardize messages and codes.

---
Implementation Notes
