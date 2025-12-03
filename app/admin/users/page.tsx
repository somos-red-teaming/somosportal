'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
}

const PAGE_SIZE = 10

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const fetchUsers = async () => {
    setLoading(true)
    let query = supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at', { count: 'exact' })

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    setUsers(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'participant' : 'admin'
    await supabase.from('users').update({ role: newRole }).eq('id', userId)
    fetchUsers()
  }

  const toggleActive = async (userId: string, isActive: boolean) => {
    console.log('toggleActive called:', userId, isActive, '-> setting to:', !isActive)
    const { error } = await supabase.from('users').update({ is_active: !isActive }).eq('id', userId)
    if (error) console.error('Update error:', error)
    fetchUsers()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Users ({total})</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : users.length === 0 ? (
                <p className="text-muted-foreground">No users found.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Email</th>
                          <th className="text-left py-3 px-2">Name</th>
                          <th className="text-left py-3 px-2">Role</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Joined</th>
                          <th className="text-left py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b">
                            <td className="py-3 px-2">{user.email}</td>
                            <td className="py-3 px-2">{user.full_name || '-'}</td>
                            <td className="py-3 px-2">
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">{new Date(user.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-2 space-x-2">
                              <Button size="sm" variant="outline" onClick={() => toggleRole(user.id, user.role)}>
                                {user.role === 'admin' ? 'Make Participant' : 'Make Admin'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => toggleActive(user.id, user.is_active)}>
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminRoute>
  )
}
