# Rate Limiting System

**Document Type:** Technical Documentation  
**Last Updated:** January 1, 2026  
**Platform:** SOMOS AI Red-Teaming Platform

---

## Overview

Rate limiting protects the SOMOS platform from abuse, DoS attacks, and excessive API usage. It's implemented as global middleware that tracks requests per IP address.

---

## Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Window | 60 seconds | Time window for counting requests |
| Limit | 40 requests | Maximum requests per window per IP |
| Scope | All `/api/*` routes | Applied globally to API endpoints |

---

## Implementation

### Middleware Location

```
/middleware.ts
```

### How It Works

1. Every API request passes through the middleware
2. Client IP is extracted from headers (`x-forwarded-for` or `x-real-ip`)
3. Request count is tracked in memory per IP
4. If limit exceeded, returns `429 Too Many Requests`
5. Counter resets after 60 seconds

### Response When Rate Limited

```json
{
  "error": "Too many requests. Please try again later."
}
```

**HTTP Status:** `429 Too Many Requests`

---

## Code Reference

```typescript
// middleware.ts
const WINDOW_MS = 60 * 1000  // 1 minute
const API_LIMIT = 40         // requests per minute

function checkRateLimit(ip: string, limit: number): boolean {
  const now = Date.now()
  const record = requests.get(ip)

  if (!record || now > record.resetTime) {
    requests.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return true
  }

  if (record.count >= limit) return false
  record.count++
  return true
}
```

---

## Adjusting Limits

To change the rate limit, edit `middleware.ts`:

```typescript
const API_LIMIT = 40  // Change this value
```

### Recommended Limits by Use Case

| Scenario | Recommended Limit |
|----------|-------------------|
| Development | 100/min |
| Production (normal) | 40/min |
| Production (strict) | 20/min |
| High-traffic events | 60/min |

---

## Limitations

- **In-memory storage:** Resets on server restart
- **Single instance:** Not shared across serverless functions
- **No per-endpoint limits:** Same limit for all APIs

### For Production Scale

Consider upgrading to:
- Redis-based rate limiting
- Vercel/Netlify edge rate limiting
- Cloudflare rate limiting rules

---

## Monitoring

Rate limit hits are not currently logged. To add logging:

```typescript
if (!checkRateLimit(ip, API_LIMIT)) {
  console.warn(`Rate limit exceeded for IP: ${ip}`)
  return NextResponse.json(...)
}
```

---

*Last Updated: January 1, 2026*
