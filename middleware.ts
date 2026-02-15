import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// In-memory rate limit store
const requests = new Map<string, { count: number; resetTime: number }>()

const WINDOW_MS = 60 * 1000 // 1 minute
const API_LIMIT = 40 // requests per minute for API routes

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown'
}

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

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Refresh Supabase session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  // Only rate limit API routes, but exclude timer updates
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Skip rate limiting for timer updates (they happen every second)
    if (request.nextUrl.pathname.startsWith('/api/exercises/timer/update')) {
      return response
    }
    
    const ip = getClientIP(request)
    
    if (!checkRateLimit(ip, API_LIMIT)) {
      // Return 429 with refreshed cookies
      const rateLimitResponse = NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
      // Copy cookies from response
      response.cookies.getAll().forEach(cookie => {
        rateLimitResponse.cookies.set(cookie.name, cookie.value)
      })
      return rateLimitResponse
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
