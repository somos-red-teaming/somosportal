'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Exercise {
  id: string
  title: string
  description: string
  category: string
  difficulty_level: string
  status: string
  guidelines: string
  created_at: string
}

const PAGE_SIZE = 10

const emptyExercise = {
  title: '',
  description: '',
  category: '',
  difficulty_level: 'beginner',
  status: 'draft',
  guidelines: '',
  instructions: {},
}

export default function AdminExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyExercise)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchExercises()
  }, [page, search])

  const fetchExercises = async () => {
    setLoading(true)
    let query = supabase
      .from('exercises')
      .select('*', { count: 'exact' })

    if (search) {
      query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`)
    }

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    setExercises(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.category || !form.guidelines) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingId) {
      await supabase.from('exercises').update({
        title: form.title,
        description: form.description,
        category: form.category,
        difficulty_level: form.difficulty_level,
        status: form.status,
        guidelines: form.guidelines,
        instructions: form.instructions,
      }).eq('id', editingId)
    } else {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      await supabase.from('exercises').insert({
        ...form,
        created_by: userData?.id,
      })
    }

    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyExercise)
    fetchExercises()
  }

  const handleEdit = (exercise: Exercise) => {
    setForm({
      title: exercise.title,
      description: exercise.description,
      category: exercise.category,
      difficulty_level: exercise.difficulty_level,
      status: exercise.status,
      guidelines: exercise.guidelines,
      instructions: {},
    })
    setEditingId(exercise.id)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exercise?')) return
    await supabase.from('exercises').delete().eq('id', id)
    fetchExercises()
  }

  const statusColor = (status: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      draft: 'secondary',
      completed: 'secondary',
    }
    return colors[status] || 'secondary'
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <h1 className="text-3xl font-bold">Exercise Management</h1>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) { setEditingId(null); setForm(emptyExercise) }
            }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />New Exercise</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit Exercise' : 'Create Exercise'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g., Democracy, Education, Climate" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Difficulty</Label>
                      <Select value={form.difficulty_level} onValueChange={(v) => setForm({ ...form, difficulty_level: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Guidelines</Label>
                    <Textarea value={form.guidelines} onChange={(e) => setForm({ ...form, guidelines: e.target.value })} rows={4} placeholder="Testing guidelines for participants..." />
                  </div>
                  <Button onClick={handleSubmit} className="w-full">{editingId ? 'Update' : 'Create'} Exercise</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Exercises ({total})</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or category..."
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
              ) : exercises.length === 0 ? (
                <p className="text-muted-foreground">No exercises found.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Title</th>
                          <th className="text-left py-3 px-2">Category</th>
                          <th className="text-left py-3 px-2">Difficulty</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Created</th>
                          <th className="text-left py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercises.map((ex) => (
                          <tr key={ex.id} className="border-b">
                            <td className="py-3 px-2 font-medium">{ex.title}</td>
                            <td className="py-3 px-2">{ex.category}</td>
                            <td className="py-3 px-2 capitalize">{ex.difficulty_level}</td>
                            <td className="py-3 px-2">
                              <Badge variant={statusColor(ex.status)}>{ex.status}</Badge>
                            </td>
                            <td className="py-3 px-2">{new Date(ex.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-2 space-x-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(ex)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(ex.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
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
