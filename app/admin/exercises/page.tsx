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
import { previewBlindAssignments, assignModelsToExercise } from '@/lib/blind-assignment'
import { ArrowLeft, Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Users, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Exercise {
  id: string
  title: string
  description: string
  category: string
  difficulty_level: string
  status: string
  guidelines: string
  start_date: string | null
  end_date: string | null
  max_participants: number | null
  target_models: string[] | null
  created_at: string
  participant_count?: number
}

interface AIModel {
  id: string
  name: string
  display_name: string
  provider: string
}

const PAGE_SIZE = 10

const emptyExercise = {
  title: '',
  description: '',
  category: '',
  difficulty_level: 'beginner',
  status: 'draft',
  guidelines: '',
  start_date: '',
  end_date: '',
  max_participants: '',
  target_models: [] as string[],
}

export default function AdminExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyExercise)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchExercises()
    fetchModels()
  }, [page, search])

  /**
   * Fetch available AI models from database
   * Gets active models with full details, filtering out test entries
   */
  const fetchModels = async () => {
    const { data } = await supabase
      .from('ai_models')
      .select('id, name, display_name, provider')
      .eq('is_active', true)
      .not('name', 'ilike', '%test%') // Filter out test models
      .not('display_name', 'ilike', '%test%') // Filter out test display names
      .order('name')
    
    // Clean up the data - use proper display names
    const cleanModels = (data || []).map(model => ({
      ...model,
      display_name: model.display_name && !model.display_name.includes('Model ') 
        ? model.display_name 
        : model.name
    }))
    
    setModels(cleanModels)
  }

  const fetchExercises = async () => {
    setLoading(true)
    let query = supabase.from('exercises').select('*', { count: 'exact' })
    if (search) query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`)

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (data) {
      const ids = data.map(e => e.id)
      const { data: participation } = await supabase
        .from('exercise_participation')
        .select('exercise_id')
        .in('exercise_id', ids)

      const counts: Record<string, number> = {}
      participation?.forEach(p => { counts[p.exercise_id] = (counts[p.exercise_id] || 0) + 1 })
      data.forEach(e => { e.participant_count = counts[e.id] || 0 })
    }

    setExercises(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  /**
   * Validate form fields and return errors
   */
  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {}
    if (!form.title.trim()) newErrors.title = 'Title is required'
    if (!form.description.trim()) newErrors.description = 'Description is required'
    if (!form.category.trim()) newErrors.category = 'Category is required'
    if (!form.guidelines.trim()) newErrors.guidelines = 'Guidelines are required'
    return newErrors
  }

  /**
   * Submit exercise form - create new or update existing
   * Saves exercise data and assigns models with blind names to junction table
   */
  const handleSubmit = async () => {
    const validationErrors = validateForm()
    setErrors(validationErrors)
    
    if (Object.keys(validationErrors).length > 0) return
    
    setSaving(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const exerciseData = {
      title: form.title,
      description: form.description,
      category: form.category,
      difficulty_level: form.difficulty_level,
      status: form.status,
      guidelines: form.guidelines,
      instructions: {},
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
    }

    let exerciseId = editingId

    if (editingId) {
      // Update existing exercise
      await supabase.from('exercises').update(exerciseData).eq('id', editingId)
    } else {
      // Create new exercise
      const { data: userData } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single()
      const { data: newExercise } = await supabase
        .from('exercises')
        .insert({ ...exerciseData, created_by: userData?.id })
        .select('id')
        .single()
      exerciseId = newExercise?.id
    }

    // Assign models with blind names to junction table
    if (exerciseId && form.target_models.length > 0) {
      await assignModelsToExercise(exerciseId, form.target_models)
    }

    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyExercise)
    setSaving(false)
    fetchExercises()
  }

  const handleEdit = (ex: Exercise) => {
    setForm({
      title: ex.title,
      description: ex.description,
      category: ex.category,
      difficulty_level: ex.difficulty_level,
      status: ex.status,
      guidelines: ex.guidelines,
      start_date: ex.start_date?.split('T')[0] || '',
      end_date: ex.end_date?.split('T')[0] || '',
      max_participants: ex.max_participants?.toString() || '',
      target_models: ex.target_models || [],
    })
    setEditingId(ex.id)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exercise?')) return
    await supabase.from('exercises').delete().eq('id', id)
    fetchExercises()
  }

  /**
   * Toggle model selection and update blind name preview
   * @param modelId - ID of the model to toggle
   */
  const toggleModel = (modelId: string) => {
    setForm(f => ({
      ...f,
      target_models: f.target_models.includes(modelId)
        ? f.target_models.filter(id => id !== modelId)
        : [...f.target_models, modelId]
    }))
  }

  // Generate blind name preview for selected models
  const blindPreview = previewBlindAssignments(form.target_models)

  const statusColor = (s: string): 'default' | 'secondary' | 'destructive' => 
    s === 'active' ? 'default' : s === 'paused' ? 'destructive' : 'secondary'

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
              if (!open) { setEditingId(null); setForm(emptyExercise); setErrors({}) }
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
                    <Label>Title *</Label>
                    <Input 
                      value={form.title} 
                      onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors(prev => ({ ...prev, title: '' })) }}
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                  </div>
                  <div>
                    <Label>Description *</Label>
                    <Textarea 
                      value={form.description} 
                      onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors(prev => ({ ...prev, description: '' })) }}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category *</Label>
                      <Input 
                        value={form.category} 
                        onChange={(e) => { setForm({ ...form, category: e.target.value }); setErrors(prev => ({ ...prev, category: '' })) }} 
                        placeholder="e.g., Democracy, Education"
                        className={errors.category ? 'border-red-500' : ''}
                      />
                      {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                    </div>
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max Participants</Label>
                      <Input type="number" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} placeholder="Unlimited" />
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
                  {models.length > 0 && (
                    <div>
                      <Label>Target AI Models</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {models.map((m) => (
                          <Badge 
                            key={m.id} 
                            variant={form.target_models.includes(m.id) ? 'default' : 'outline'} 
                            className="cursor-pointer" 
                            onClick={() => toggleModel(m.id)}
                          >
                            {m.display_name || m.name}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Blind name preview for selected models */}
                      {form.target_models.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <Label className="text-sm font-medium text-blue-900">Blind Name Assignment Preview:</Label>
                          <div className="mt-2 space-y-1">
                            {blindPreview.map((assignment, index) => {
                              const model = models.find(m => m.id === assignment.modelId)
                              return (
                                <div key={assignment.modelId} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">{model?.display_name || model?.name}</span>
                                  <Badge variant="secondary">{assignment.blindName}</Badge>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <Label>Guidelines *</Label>
                    <Textarea 
                      value={form.guidelines} 
                      onChange={(e) => { setForm({ ...form, guidelines: e.target.value }); setErrors(prev => ({ ...prev, guidelines: '' })) }} 
                      rows={4} 
                      placeholder="Testing guidelines..."
                      className={errors.guidelines ? 'border-red-500' : ''}
                    />
                    {errors.guidelines && <p className="text-red-500 text-xs mt-1">{errors.guidelines}</p>}
                  </div>
                  <Button onClick={handleSubmit} className="w-full" disabled={saving}>
                    {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')} Exercise
                  </Button>
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
                  <Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <p>Loading...</p> : exercises.length === 0 ? <p className="text-muted-foreground">No exercises found.</p> : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Title</th>
                          <th className="text-left py-3 px-2">Category</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Dates</th>
                          <th className="text-left py-3 px-2">Participants</th>
                          <th className="text-left py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercises.map((ex) => (
                          <tr key={ex.id} className="border-b">
                            <td className="py-3 px-2">
                              <div className="font-medium">{ex.title}</div>
                              <div className="text-xs text-muted-foreground capitalize">{ex.difficulty_level}</div>
                            </td>
                            <td className="py-3 px-2">{ex.category}</td>
                            <td className="py-3 px-2"><Badge variant={statusColor(ex.status)}>{ex.status}</Badge></td>
                            <td className="py-3 px-2 text-sm">
                              {ex.start_date || ex.end_date ? (
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{ex.start_date?.split('T')[0] || '?'} - {ex.end_date?.split('T')[0] || '?'}</span>
                              ) : <span className="text-muted-foreground">No dates</span>}
                            </td>
                            <td className="py-3 px-2">
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{ex.participant_count || 0}{ex.max_participants ? `/${ex.max_participants}` : ''}</span>
                            </td>
                            <td className="py-3 px-2 space-x-1">
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(ex)}><Pencil className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(ex.id)}><Trash2 className="h-4 w-4" /></Button>
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
                        <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
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
