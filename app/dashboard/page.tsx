'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { User, Activity, Flag, Trophy, Shield } from 'lucide-react'

interface UserStats {
  interactions: number
  flags: number
  exercises: number
  reputation: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { isAdmin } = useRole()
  const [stats, setStats] = useState<UserStats>({ interactions: 0, flags: 0, exercises: 0, reputation: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!userData) {
        setLoading(false)
        return
      }

      const [interactions, flags, participation, profile] = await Promise.all([
        supabase.from('interactions').select('id', { count: 'exact', head: true }).eq('user_id', userData.id),
        supabase.from('flags').select('id', { count: 'exact', head: true }).eq('user_id', userData.id),
        supabase.from('exercise_participation').select('id', { count: 'exact', head: true }).eq('user_id', userData.id).eq('status', 'completed'),
        supabase.from('user_profiles').select('reputation_score').eq('user_id', userData.id).single(),
      ])

      setStats({
        interactions: interactions.count || 0,
        flags: flags.count || 0,
        exercises: participation.count || 0,
        reputation: profile.data?.reputation_score || 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [user])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground">
              {user?.email} • {isAdmin ? 'Admin' : 'Participant'}
            </p>
          </div>

          {isAdmin && (
            <Card className="mb-8 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-3">
                <Button asChild className="w-full lg:w-auto"><Link href="/admin">Admin Dashboard</Link></Button>
                <Button variant="outline" asChild className="w-full lg:w-auto"><Link href="/admin/users">Manage Users</Link></Button>
                <Button variant="outline" asChild className="w-full lg:w-auto"><Link href="/admin/exercises">Manage Exercises</Link></Button>
                <Button variant="outline" asChild className="w-full lg:w-auto"><Link href="/admin/models">Manage Models</Link></Button>
                <Button variant="outline" asChild className="w-full lg:w-auto"><Link href="/admin/flags">Manage Flags</Link></Button>
                <Button variant="outline" asChild className="w-full lg:w-auto"><Link href="/admin/conversations">Conversations</Link></Button>
                <Button variant="outline" asChild className="w-full lg:w-auto"><Link href="/admin/export">Export Data</Link></Button>
                <Button variant="outline" asChild className="w-full lg:w-auto"><Link href="/api-tester">API Tester</Link></Button>
                <Button variant="outline" asChild className="w-full lg:w-auto"><Link href="/api-docs">API Docs</Link></Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card className="bg-[#B5D3C7] border-[#B5D3C7]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-black">Interactions</CardTitle>
                <Activity className="h-4 w-4 text-black/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{loading ? '...' : stats.interactions}</div>
                <p className="text-xs text-black/70">AI model interactions</p>
              </CardContent>
            </Card>

            <Card className="bg-[#FABBA3] border-[#FABBA3]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-black">Flags Submitted</CardTitle>
                <Flag className="h-4 w-4 text-black/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{loading ? '...' : stats.flags}</div>
                <p className="text-xs text-black/70">Issues reported</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-[#F3D59D] border-[#F3D59D]">
              <CardHeader>
                <CardTitle className="text-black">Get Started</CardTitle>
                <CardDescription className="text-black/70">Begin your AI red-teaming journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-black/70">
                  Browse available red-teaming exercises and choose one that interests you.
                </p>
                <Button asChild><Link href="/exercises">View Exercises</Link></Button>
              </CardContent>
            </Card>

            <Card className="bg-[#D5C1C3] border-[#D5C1C3]">
              <CardHeader>
                <CardTitle className="text-black">Your Profile</CardTitle>
                <CardDescription className="text-black/70">Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-black/70">
                  Update your profile information and preferences.
                </p>
                <Button variant="outline" asChild className="border-black/20 hover:bg-black/10"><Link href="/profile">Edit Profile</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
