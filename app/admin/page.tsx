'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Users, FileText, Flag, Activity, Bot, Code, TestTube, Download, MessageSquare, UsersRound } from 'lucide-react'

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
      const supabase = createClient()
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
            <Card className="bg-[#B5D3C7] border-[#B5D3C7]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-black">Total Users</CardTitle>
                <Users className="h-4 w-4 text-black/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{stats.users}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#FABBA3] border-[#FABBA3]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-black">Exercises</CardTitle>
                <FileText className="h-4 w-4 text-black/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{stats.exercises}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#F3D59D] border-[#F3D59D]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-black">Flags</CardTitle>
                <Flag className="h-4 w-4 text-black/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{stats.flags}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#D5C1C3] border-[#D5C1C3]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-black">Interactions</CardTitle>
                <Activity className="h-4 w-4 text-black/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{stats.interactions}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersRound className="h-5 w-5" />
                  Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Create teams and manage team memberships.</p>
                <Button asChild><Link href="/admin/teams">Manage Teams</Link></Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Configure AI providers and manage model settings.</p>
                <Button asChild><Link href="/admin/models">Manage Models</Link></Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Flag Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Review and manage flagged AI responses.</p>
                <div className="flex gap-2">
                  <Button asChild><Link href="/admin/flags">Manage Flags</Link></Button>
                  <Button variant="outline" asChild><Link href="/admin/flag-packages">Packages</Link></Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">View all participant conversations with AI models.</p>
                <Button asChild><Link href="/admin/conversations">Manage Conversations</Link></Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Data Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Export flags, interactions, and exercises data.</p>
                <Button asChild><Link href="/admin/export">Export Data</Link></Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  API Tester
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Test AI models with interactive interface.</p>
                <Button asChild><Link href="/api-tester">Test APIs</Link></Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Complete API documentation with Swagger UI.</p>
                <Button className="bg-green-600 hover:bg-green-700" asChild><Link href="/api-docs">View API Docs</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}
