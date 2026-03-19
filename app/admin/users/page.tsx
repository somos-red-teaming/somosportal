'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface User {
  id: string
  auth_user_id: string | null
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  credits: number | null
  created_at: string
}

const PAGE_SIZE = 10

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteActivity, setDeleteActivity] = useState<{ interactions: number; flags: number; teams: number } | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const fetchUsers = async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('users')
      .select('id, auth_user_id, email, full_name, role, is_active, credits, created_at', { count: 'exact' })

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
    const supabase = createClient()
    await supabase.from('users').update({ role: newRole }).eq('id', userId)
    fetchUsers()
  }

  const toggleActive = async (userId: string, isActive: boolean) => {
    console.log('toggleActive called:', userId, isActive, '-> setting to:', !isActive)
    const supabase = createClient()
    const { error } = await supabase.from('users').update({ is_active: !isActive }).eq('id', userId)
    if (error) console.error('Update error:', error)
    fetchUsers()
  }

  const addCredits = async (userId: string, amount: number) => {
    const user = users.find(u => u.id === userId)
    if (!user) return
    const newCredits = (user.credits ?? 0) + amount
    const supabase = createClient()
    await supabase.from('users').update({ credits: newCredits }).eq('id', userId)
    fetchUsers()
  }

  const handleDeleteUser = async () => {
    if (!deleteUser || deleteConfirm !== deleteUser.email) return
    setDeleting(true)
    
    const supabase = createClient()

    // Delete from users table (trigger handles related data)
    const { error } = await supabase.from('users').delete().eq('id', deleteUser.id)
    if (error) {
      console.error('Delete error:', error)
      alert('Failed to delete user: ' + error.message)
      setDeleting(false)
      return
    }

    // Delete from Supabase Auth
    if (deleteUser.auth_user_id) {
      await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authUserId: deleteUser.auth_user_id })
      })
    }

    setDeleting(false)
    setDeleteUser(null)
    setDeleteConfirm('')
    setDeleteActivity(null)
    fetchUsers()
  }

  const openDeleteDialog = async (user: User) => {
    setDeleteUser(user)
    setDeleteConfirm('')
    const supabase = createClient()
    const [interactions, flags, teams] = await Promise.all([
      supabase.from('interactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('flags').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])
    setDeleteActivity({
      interactions: interactions.count || 0,
      flags: flags.count || 0,
      teams: teams.count || 0
    })
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
                          <th className="text-left py-3 px-2">Credits</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Joined</th>
                          <th className="text-left py-3 px-2 text-green-600 font-semibold">Actions</th>
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
                              <div className="flex items-center gap-2">
                                <span>{user.credits ?? 0}</span>
                                <Input
                                  type="number"
                                  className="w-20 h-8"
                                  placeholder="+"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = parseInt((e.target as HTMLInputElement).value)
                                      if (val) { addCredits(user.id, val); (e.target as HTMLInputElement).value = '' }
                                    }
                                  }}
                                />
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">{new Date(user.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-2 space-x-2">
                              <Button size="sm" variant={user.role === 'admin' ? 'secondary' : 'default'} onClick={() => toggleRole(user.id, user.role)}>
                                {user.role === 'admin' ? 'Make Participant' : 'Make Admin'}
                              </Button>
                              <Button size="sm" variant={user.is_active ? 'destructive' : 'default'} onClick={() => toggleActive(user.id, user.is_active)}>
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => openDeleteDialog(user)}>
                                <Trash2 className="h-3.5 w-3.5" />
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

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteUser} onOpenChange={(open) => { if (!open) { setDeleteUser(null); setDeleteConfirm(''); setDeleteActivity(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will permanently delete <span className="font-semibold text-foreground">{deleteUser?.full_name || deleteUser?.email}</span> and all their data. This action cannot be undone.
            </p>
            {deleteActivity && (deleteActivity.interactions > 0 || deleteActivity.flags > 0 || deleteActivity.teams > 0) && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-1">
                <p className="text-sm font-semibold text-destructive">⚠️ This user has activity that will be permanently deleted:</p>
                <ul className="text-sm text-destructive/80 list-disc list-inside">
                  {deleteActivity.interactions > 0 && <li>{deleteActivity.interactions} conversations</li>}
                  {deleteActivity.flags > 0 && <li>{deleteActivity.flags} flags submitted</li>}
                  {deleteActivity.teams > 0 && <li>{deleteActivity.teams} team memberships</li>}
                </ul>
              </div>
            )}
            <div>
              <Label className="text-sm">Type <span className="font-mono font-semibold">{deleteUser?.email}</span> to confirm</Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type email to confirm..."
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDeleteUser(null); setDeleteConfirm(''); setDeleteActivity(null) }}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={deleteConfirm !== deleteUser?.email || deleting}
                onClick={handleDeleteUser}
              >
                {deleting ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminRoute>
  )
}
