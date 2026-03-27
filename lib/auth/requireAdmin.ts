import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AdminResult {
  authorized: boolean
  response?: NextResponse
  userId?: string
}

/**
 * Ensures the current request comes from an authenticated admin user.
 * Returns { authorized: true } when the caller is an admin, otherwise a
 * NextResponse ready to return from the route handler.
 */
export async function requireAdmin(): Promise<AdminResult> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const { data: dbUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!dbUser || dbUser.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { authorized: true, userId: dbUser.id }
}
