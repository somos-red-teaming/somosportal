'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { RichTextEditor } from '@/components/RichTextEditor'
import { createClient } from '@/lib/supabase/client'
import { previewBlindAssignments, assignModelsToExercise } from '@/lib/blind-assignment'
import { ArrowLeft, Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Users, Calendar, UserPlus, X, FileText, Shield, Brain, Eye, Lock, AlertTriangle, Zap, Target, MessageSquare, Bot, Sparkles } from 'lucide-react'
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
  flag_package_id: string | null
  visibility: string
  icon: string | null
  color: string | null
  created_at: string
  participant_count?: number
}

interface AIModel {
  id: string
  name: string
  display_name: string
  provider: string
  temperature?: number
}

interface Team {
  id: string
  name: string
}

const PAGE_SIZE = 10

const iconOptions = ['FileText', 'Shield', 'Brain', 'Eye', 'Lock', 'AlertTriangle', 'Zap', 'Target', 'Search', 'MessageSquare', 'Bot', 'Sparkles']
const colorOptions = ['blue', 'red', 'green', 'purple', 'orange', 'pink', 'cyan', 'yellow']

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
  temperature_overrides: {} as Record<string, number | null>,
  flag_package_id: '',
  visibility: 'public',
  assigned_teams: [] as string[],
  icon: 'FileText',
  color: 'blue',
  timer_enabled: false,
  time_limit_minutes: '',
}

const iconMap: Record<string, React.ComponentType<{className?: string}>> = {
  FileText, Shield, Brain, Eye, Lock, AlertTriangle, Zap, Target, Search, MessageSquare, Bot, Sparkles
}

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
  yellow: 'bg-yellow-500',
}

interface FlagPackage {
  id: string
  name: string
}

export default function AdminExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [models, setModels] = useState<AIModel[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [flagPackages, setFlagPackages] = useState<FlagPackage[]>([])
  const [users, setUsers] = useState<{id: string, email: string, full_name: string | null}[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteExercise, setInviteExercise] = useState<Exercise | null>(null)
  const [invites, setInvites] = useState<{id: string, user_id: string, status: string, user?: {email: string, full_name: string | null}}[]>([])
  const [inviteSearch, setInviteSearch] = useState('')
  const [inviteUserPage, setInviteUserPage] = useState(0)
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
    fetchFlagPackages()
    fetchTeams()
    fetchUsers()
  }, [page, search])

  const fetchFlagPackages = async () => {
    const { data } = await supabase.from('flag_packages').select('id, name').order('name')
    setFlagPackages(data || [])
  }

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('id, name').order('name')
    setTeams(data || [])
  }

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('id, email, full_name').order('email')
    setUsers(data || [])
  }

  const fetchInvites = async (exerciseId: string) => {
    const { data } = await supabase
      .from('exercise_invites')
      .select('id, user_id, status, user:users(email, full_name)')
      .eq('exercise_id', exerciseId)
    setInvites((data || []).map(d => ({
      ...d,
      user: Array.isArray(d.user) ? d.user[0] : d.user
    })))
  }

  const openInviteDialog = async (ex: Exercise) => {
    setInviteExercise(ex)
    setInviteSearch('')
    setInviteUserPage(0)
    await fetchInvites(ex.id)
    setInviteDialogOpen(true)
  }

  const addInvite = async (userId: string) => {
    if (!inviteExercise) return
    await supabase.from('exercise_invites').insert({
      exercise_id: inviteExercise.id,
      user_id: userId
    })
    fetchInvites(inviteExercise.id)
  }

  const removeInvite = async (inviteId: string) => {
    await supabase.from('exercise_invites').delete().eq('id', inviteId)
    if (inviteExercise) fetchInvites(inviteExercise.id)
  }

  /**
   * Fetch available AI models from database
   * Gets active models with full details, filtering out test entries
   */
  const fetchModels = async () => {
    const { data } = await supabase
      .from('ai_models')
      .select('id, name, display_name, provider, temperature')
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
      flag_package_id: form.flag_package_id || null,
      visibility: form.visibility,
      icon: form.icon,
      color: form.color,
      timer_enabled: form.timer_enabled,
      time_limit_minutes: form.timer_enabled && form.time_limit_minutes ? parseInt(form.time_limit_minutes) : null,
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

    // Assign models with blind names and temperature overrides to junction table
    if (exerciseId && form.target_models.length > 0) {
      await assignModelsToExercise(exerciseId, form.target_models, form.temperature_overrides)
    }

    // Assign teams for team_only visibility
    if (exerciseId) {
      await supabase.from('exercise_teams').delete().eq('exercise_id', exerciseId)
      if (form.visibility === 'team_only' && form.assigned_teams.length > 0) {
        await supabase.from('exercise_teams').insert(
          form.assigned_teams.map(teamId => ({ exercise_id: exerciseId, team_id: teamId }))
        )
      }
    }

    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyExercise)
    setSaving(false)
    fetchExercises()
  }

  const handleEdit = async (ex: Exercise) => {
    // Fetch assigned models and temperature overrides from junction table
    const { data: exerciseModels } = await supabase
      .from('exercise_models')
      .select('model_id, temperature_override')
      .eq('exercise_id', ex.id)
    
    // Fetch assigned teams
    const { data: exerciseTeams } = await supabase
      .from('exercise_teams')
      .select('team_id')
      .eq('exercise_id', ex.id)
    
    const assignedModels = exerciseModels?.map(em => em.model_id) || []
    const tempOverrides: Record<string, number | null> = {}
    exerciseModels?.forEach(em => {
      if (em.temperature_override !== null) {
        tempOverrides[em.model_id] = em.temperature_override
      }
    })

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
      target_models: assignedModels,
      temperature_overrides: tempOverrides,
      flag_package_id: ex.flag_package_id || '',
      visibility: ex.visibility || 'public',
      assigned_teams: exerciseTeams?.map(et => et.team_id) || [],
      icon: ex.icon || 'FileText',
      color: ex.color || 'blue',
      timer_enabled: (ex as any).timer_enabled || false,
      time_limit_minutes: (ex as any).time_limit_minutes?.toString() || '',
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <h1 className="text-3xl font-bold">Exercise Management</h1>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) { setEditingId(null); setForm(emptyExercise) }
              setErrors({})
            }}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />New Exercise</Button>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Icon</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {iconOptions.map(icon => {
                          const Icon = iconMap[icon]
                          return (
                            <div
                              key={icon}
                              onClick={() => setForm({ ...form, icon })}
                              className={`p-2 rounded cursor-pointer border ${form.icon === icon ? 'border-primary bg-primary/10' : 'border-muted hover:bg-muted'}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {colorOptions.map(color => (
                          <div
                            key={color}
                            onClick={() => setForm({ ...form, color })}
                            className={`w-8 h-8 rounded cursor-pointer ${colorClasses[color]} ${form.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Description *</Label>
                    <RichTextEditor 
                      content={form.description} 
                      onChange={(content) => { setForm({ ...form, description: content }); setErrors(prev => ({ ...prev, description: '' })) }}
                      placeholder="Describe the exercise..."
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
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="timer_enabled"
                        checked={form.timer_enabled}
                        onChange={(e) => setForm({ ...form, timer_enabled: e.target.checked, time_limit_minutes: e.target.checked ? form.time_limit_minutes : '' })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="timer_enabled" className="cursor-pointer font-medium">Enable Time Limit</Label>
                    </div>
                    {form.timer_enabled && (
                      <div>
                        <Label>Time Limit (minutes) *</Label>
                        <Input 
                          type="number" 
                          min="1"
                          value={form.time_limit_minutes} 
                          onChange={(e) => setForm({ ...form, time_limit_minutes: e.target.value })} 
                          placeholder="e.g., 30, 60, 120"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Exercise will lock when time expires. Timer pauses when user leaves.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Visibility</Label>
                      <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v, assigned_teams: v === 'team_only' ? form.assigned_teams : [] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="team_only">Team Only</SelectItem>
                          <SelectItem value="invite_only">Invite Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {form.visibility === 'team_only' && (
                      <div>
                        <Label>Assign to Teams</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {teams.map((t) => (
                            <Badge
                              key={t.id}
                              variant={form.assigned_teams.includes(t.id) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => setForm(f => ({
                                ...f,
                                assigned_teams: f.assigned_teams.includes(t.id)
                                  ? f.assigned_teams.filter(id => id !== t.id)
                                  : [...f.assigned_teams, t.id]
                              }))}
                            >
                              {t.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Flag Categories Package</Label>
                    <Select value={form.flag_package_id} onValueChange={(v) => setForm({ ...form, flag_package_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Default categories" /></SelectTrigger>
                      <SelectContent>
                        {flagPackages.map(pkg => (
                          <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Categories shown when participants flag responses</p>
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
                    </div>
                  )}
                  {form.target_models.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <Label className="text-sm font-medium text-blue-900">Model Assignment & Temperature:</Label>
                      <div className="mt-3 space-y-3">
                        {blindPreview.map((assignment) => {
                          const model = models.find(m => m.id === assignment.modelId)
                          const defaultTemp = model?.temperature ?? 0.7
                          const override = form.temperature_overrides?.[assignment.modelId]
                          return (
                            <div key={assignment.modelId} className="flex items-center gap-3">
                              <span className="text-gray-700 flex-1">{model?.display_name || model?.name}</span>
                              <Badge variant="secondary">{assignment.blindName}</Badge>
                              <Input
                                type="number"
                                min="0"
                                max="2"
                                step="0.1"
                                placeholder={String(defaultTemp)}
                                value={override ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value ? parseFloat(e.target.value) : null
                                  setForm(f => ({
                                    ...f,
                                    temperature_overrides: { ...f.temperature_overrides, [assignment.modelId]: val }
                                  }))
                                }}
                                className="w-24"
                              />
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">Leave blank for model default. 0 = deterministic • 0.3-0.5 = focused • 0.7 = balanced • 1.0+ = creative</p>
                    </div>
                  )}
                  <div>
                    <Label>Guidelines *</Label>
                    <RichTextEditor 
                      content={form.guidelines} 
                      onChange={(content) => { setForm({ ...form, guidelines: content }); setErrors(prev => ({ ...prev, guidelines: '' })) }}
                      placeholder="Testing guidelines..."
                    />
                    {errors.guidelines && <p className="text-red-500 text-xs mt-1">{errors.guidelines}</p>}
                  </div>
                  {Object.keys(errors).length > 0 && (
                    <p className="text-red-500 text-sm text-center">Please fix the errors above before saving.</p>
                  )}
                  <Button onClick={handleSubmit} className="w-full" disabled={saving}>
                    {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')} Exercise
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Invite Management Dialog */}
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Manage Invites: {inviteExercise?.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Invite User</Label>
                    <Input 
                      value={inviteSearch} 
                      onChange={e => { setInviteSearch(e.target.value); setInviteUserPage(0) }} 
                      placeholder="Search by email or name..."
                      className="mt-1"
                    />
                    {(() => {
                      const filtered = users.filter(u => 
                        !invites.some(i => i.user_id === u.id) &&
                        (inviteSearch === '' || 
                         u.email.toLowerCase().includes(inviteSearch.toLowerCase()) ||
                         u.full_name?.toLowerCase().includes(inviteSearch.toLowerCase()))
                      )
                      const perPage = 5
                      const totalPages = Math.ceil(filtered.length / perPage)
                      const paginated = filtered.slice(inviteUserPage * perPage, (inviteUserPage + 1) * perPage)
                      return (
                        <div className="mt-2 border rounded-md">
                          <div className="max-h-40 overflow-y-auto">
                            {paginated.map(u => (
                              <div key={u.id} className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer border-b last:border-b-0" onClick={() => addInvite(u.id)}>
                                <div>
                                  <span className="text-sm">{u.email}</span>
                                  {u.full_name && <span className="text-xs text-muted-foreground ml-2">({u.full_name})</span>}
                                </div>
                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                              </div>
                            ))}
                            {filtered.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-3">No users found</p>
                            )}
                          </div>
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between p-2 border-t bg-muted/50">
                              <Button variant="ghost" size="sm" className="text-green-600" disabled={inviteUserPage === 0} onClick={() => setInviteUserPage(p => p - 1)}>Prev</Button>
                              <span className="text-xs text-muted-foreground">{inviteUserPage + 1} / {totalPages}</span>
                              <Button variant="ghost" size="sm" className="text-green-600" disabled={inviteUserPage >= totalPages - 1} onClick={() => setInviteUserPage(p => p + 1)}>Next</Button>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  <div>
                    <Label>Invited Users ({invites.length})</Label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {invites.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">{inv.user?.email}</p>
                            {inv.user?.full_name && <p className="text-xs text-muted-foreground">{inv.user.full_name}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={inv.status === 'accepted' ? 'default' : inv.status === 'declined' ? 'destructive' : 'secondary'}>
                              {inv.status}
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={() => removeInvite(inv.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {invites.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No invites yet</p>
                      )}
                    </div>
                  </div>
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
                              {ex.visibility === 'invite_only' && (
                                <Button size="sm" variant="ghost" onClick={() => openInviteDialog(ex)} title="Manage Invites"><UserPlus className="h-4 w-4" /></Button>
                              )}
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
