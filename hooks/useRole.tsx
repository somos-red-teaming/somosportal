'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

/**
 * Hook to fetch and manage user role from database
 * @returns Object containing role, isAdmin flag, and loading state
 */
export function useRole() {
  const { user } = useAuth()
  const [role, setRole] = useState<'admin' | 'participant'>('participant')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single()

      if (data?.role === 'admin') setRole('admin')
      setLoading(false)
    }

    fetchRole()
  }, [user])

  return { role, isAdmin: role === 'admin', loading }
}
