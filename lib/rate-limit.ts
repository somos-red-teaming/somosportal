// Simple in-memory rate limiter for API protection
// Resets on server restart (fine for basic protection)

const requests = new Map<string, { count: number; resetTime: number }>()

const WINDOW_MS = 60 * 1000 // 1 minute window
const DEFAULT_LIMIT = 100 // requests per window

export function rateLimit(
  identifier: string, 
  limit: number = DEFAULT_LIMIT
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = requests.get(identifier)

  if (!record || now > record.resetTime) {
    requests.set(identifier, { count: 1, resetTime: now + WINDOW_MS })
    return { allowed: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: limit - record.count }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requests.entries()) {
    if (now > value.resetTime) {
      requests.delete(key)
    }
  }
}, 60 * 1000)
