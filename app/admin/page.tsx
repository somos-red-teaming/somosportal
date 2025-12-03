'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Users, FileText, Flag, Activity } from 'lucide-react'

interface Stats {
  users: number
  exercises: number
  flags: number
  interactions: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ users: 0, exercises: 0, flags: 0, interactions: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      const [users, exercises, flags, interactions] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('exercises').select('id', { count: 'exact', head: true }),
        supabase.from('flags').select('id', { count: 'exact', head: true }),
        supabase.from('interactions').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        users: users.count || 0,
        exercises: exercises.count || 0,
        flags: flags.count || 0,
        interactions: interactions.count || 0,
      })
    }
    fetchStats()
  }, [])

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Exercises</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.exercises}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Flags</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.flags}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Interactions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.interactions}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">View and manage platform users, assign roles.</p>
                <Button asChild><Link href="/admin/users">Manage Users</Link></Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Exercise Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Create, edit, and manage red-teaming exercises.</p>
                <Button asChild><Link href="/admin/exercises">Manage Exercises</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}
