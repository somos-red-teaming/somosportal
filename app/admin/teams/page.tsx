'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Pencil, Trash2, Users, UserPlus, X } from 'lucide-react'
import Link from 'next/link'

interface Team {
  id: string
  name: string
  description: string | null
  created_at: string
  member_count?: number
}

interface TeamMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  user?: { email: string; full_name: string | null }
}

interface User {
  id: string
  email: string
  full_name: string | null
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [form, setForm] = useState({ name: '', description: '' })
  const [searchEmail, setSearchEmail] = useState('')

  useEffect(() => {
    fetchTeams()
    fetchUsers()
  }, [])

  const fetchTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('*, team_members(count)')
      .order('created_at', { ascending: false })
    
    setTeams(data?.map(t => ({
      ...t,
      member_count: t.team_members?.[0]?.count || 0
    })) || [])
  }

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, email, full_name')
      .order('email')
    setUsers(data || [])
  }

  const fetchMembers = async (teamId: string) => {
    const { data } = await supabase
      .from('team_members')
      .select('*, user:users(email, full_name)')
      .eq('team_id', teamId)
      .order('joined_at')
    setMembers(data || [])
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    
    // Get the users table id (not auth uid)
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user?.id)
      .single()
    
    if (editingId) {
      const { error } = await supabase.from('teams').update({
        name: form.name,
        description: form.description || null
      }).eq('id', editingId)
      if (error) console.log('Update error:', error)
    } else {
      const { data, error } = await supabase.from('teams').insert({
        name: form.name,
        description: form.description || null,
        created_by: userData?.id
      }).select()
      if (error) console.log('Insert error:', error)
    }

    setDialogOpen(false)
    setForm({ name: '', description: '' })
    setEditingId(null)
    fetchTeams()
  }

  const handleEdit = (team: Team) => {
    setForm({ name: team.name, description: team.description || '' })
    setEditingId(team.id)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this team? Members will be removed.')) return
    await supabase.from('teams').delete().eq('id', id)
    fetchTeams()
  }

  const openMembers = async (team: Team) => {
    setSelectedTeam(team)
    setSearchEmail('')
    setUserPage(0)
    await fetchMembers(team.id)
    setMembersDialogOpen(true)
  }

  const addMember = async (userId: string) => {
    if (!selectedTeam) return
    await supabase.from('team_members').insert({
      team_id: selectedTeam.id,
      user_id: userId,
      role: 'member'
    })
    fetchMembers(selectedTeam.id)
    fetchTeams()
    setSearchEmail('')
  }

  const removeMember = async (memberId: string) => {
    await supabase.from('team_members').delete().eq('id', memberId)
    if (selectedTeam) {
      fetchMembers(selectedTeam.id)
      fetchTeams()
    }
  }

  const toggleRole = async (member: TeamMember) => {
    const newRole = member.role === 'admin' ? 'member' : 'admin'
    await supabase.from('team_members').update({ role: newRole }).eq('id', member.id)
    if (selectedTeam) fetchMembers(selectedTeam.id)
  }

  // Filter out existing members, search by email or name
  const filteredUsers = users.filter(u => 
    !members.some(m => m.user_id === u.id) &&
    (searchEmail === '' || 
     u.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
     u.full_name?.toLowerCase().includes(searchEmail.toLowerCase()))
  )

  const [userPage, setUserPage] = useState(0)
  const usersPerPage = 5
  const paginatedUsers = filteredUsers.slice(userPage * usersPerPage, (userPage + 1) * usersPerPage)
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage)

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin">
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
            </Link>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <Button onClick={() => { setForm({ name: '', description: '' }); setEditingId(null); setDialogOpen(true) }} className="ml-auto">
              <Plus className="h-4 w-4 mr-2" />New Team
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map(team => (
              <Card key={team.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openMembers(team)}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(team)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{team.description || 'No description'}</p>
                  <Badge variant="secondary"><Users className="h-3 w-3 mr-1" />{team.member_count} members</Badge>
                </CardContent>
              </Card>
            ))}
            {teams.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-8">No teams yet. Create one to get started.</p>
            )}
          </div>

          {/* Create/Edit Team Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Team' : 'Create Team'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Team Name *</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Research Group A" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
                </div>
                <Button onClick={handleSubmit} className="w-full">{editingId ? 'Update' : 'Create'} Team</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Manage Members Dialog */}
          <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Members of {selectedTeam?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Add member */}
                <div>
                  <Label>Add Member</Label>
                  <Input 
                    value={searchEmail} 
                    onChange={e => { setSearchEmail(e.target.value); setUserPage(0) }} 
                    placeholder="Search by email or name..."
                    className="mt-1"
                  />
                  <div className="mt-2 border rounded-md">
                    <div className="max-h-40 overflow-y-auto">
                      {paginatedUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer border-b last:border-b-0" onClick={() => addMember(u.id)}>
                          <div>
                            <span className="text-sm">{u.email}</span>
                            {u.full_name && <span className="text-xs text-muted-foreground ml-2">({u.full_name})</span>}
                          </div>
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-3">No users found</p>
                      )}
                    </div>
                    {totalUserPages > 1 && (
                      <div className="flex items-center justify-between p-2 border-t bg-muted/50">
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" disabled={userPage === 0} onClick={() => setUserPage(p => p - 1)}>Prev</Button>
                        <span className="text-xs text-muted-foreground">{userPage + 1} / {totalUserPages}</span>
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" disabled={userPage >= totalUserPages - 1} onClick={() => setUserPage(p => p + 1)}>Next</Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current members */}
                <div>
                  <Label>Current Members ({members.length})</Label>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{m.user?.email}</p>
                          {m.user?.full_name && <p className="text-xs text-muted-foreground">{m.user.full_name}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AdminRoute>
  )
}
