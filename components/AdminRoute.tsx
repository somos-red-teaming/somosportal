'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Admin route protection component
 * Redirects non-admin users to appropriate pages
 * @param children - Components to render for admin users
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: roleLoading } = useRole()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (!authLoading && !roleLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [user, isAdmin, authLoading, roleLoading, router])

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user || !isAdmin) return null

  return <>{children}</>
}
