'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { supabase } from '@/lib/supabase'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ArrowLeft, Search, ChevronLeft, ChevronRight, MessageSquare, Download, Eye, X, User, Bot, FileJson, FileSpreadsheet, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Interaction {
  id: string
  session_id: string
  prompt: string
  response: string | null
  token_count: number | null
  created_at: string
  exercise_id?: string
  model_id?: string
  temperature_override?: number | null
  user: { email: string; full_name: string | null } | null
  model: { name: string; display_name: string; temperature?: number } | null
  exercise: { title: string } | null
}

interface ConversationGroup {
  session_id: string
  messages: Interaction[]
  user: { email: string; full_name: string | null } | null
  model: { name: string; display_name: string; temperature?: number } | null
  exercise: { title: string } | null
  created_at: string
  message_count: number
  model_temperature?: number
  temperature_override?: number | null
}

const PAGE_SIZE = 20

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<ConversationGroup[]>([])
  const [allData, setAllData] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [exerciseFilter, setExerciseFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exercises, setExercises] = useState<{ id: string; title: string }[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [sessionMessages, setSessionMessages] = useState<Interaction[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchExercises()
  }, [])

  useEffect(() => {
    fetchInteractions()
  }, [page, search, exerciseFilter, dateFrom, dateTo])

  const fetchExercises = async () => {
    const { data } = await supabase.from('exercises').select('id, title').order('title')
    setExercises(data || [])
  }

  const fetchInteractions = async () => {
    setLoading(true)
    let query = supabase
      .from('interactions')
      .select(`
        id, session_id, prompt, response, token_count, created_at, exercise_id, model_id,
        user:users(email, full_name),
        model:ai_models(name, display_name, temperature),
        exercise:exercises(title)
      `)
      .order('created_at', { ascending: false })

    if (exerciseFilter) query = query.eq('exercise_id', exerciseFilter)
    if (search) query = query.or(`prompt.ilike.%${search}%,response.ilike.%${search}%`)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

    const { data } = await query
    
    // Fetch temperature overrides from exercise_models
    const { data: overrides } = await supabase
      .from('exercise_models')
      .select('exercise_id, model_id, temperature_override')
    
    const overrideMap: Record<string, number | null> = {}
    overrides?.forEach(o => {
      overrideMap[`${o.exercise_id}-${o.model_id}`] = o.temperature_override
    })
    
    // Add override to each interaction, flatten array relations
    const dataWithOverrides = (data || []).map(i => ({
      ...i,
      user: Array.isArray(i.user) ? i.user[0] || null : i.user,
      model: Array.isArray(i.model) ? i.model[0] || null : i.model,
      exercise: Array.isArray(i.exercise) ? i.exercise[0] || null : i.exercise,
      temperature_override: overrideMap[`${i.exercise_id}-${i.model_id}`] ?? null
    }))
    
    setAllData(dataWithOverrides)
    
    // Group by session_id into full conversations
    const groups: Record<string, ConversationGroup> = {}
    ;dataWithOverrides.forEach(i => {
      if (!groups[i.session_id]) {
        groups[i.session_id] = {
          session_id: i.session_id,
          messages: [],
          user: i.user,
          model: i.model,
          exercise: i.exercise,
          created_at: i.created_at,
          message_count: 0,
          model_temperature: i.model?.temperature,
          temperature_override: i.temperature_override
        }
      }
      groups[i.session_id].messages.push(i)
      groups[i.session_id].message_count++
    })
    
    const grouped = Object.values(groups).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    setTotal(grouped.length)
    setConversations(grouped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE))
    setLoading(false)
  }

  const fetchSessionMessages = async (sessionId: string) => {
    const conv = conversations.find(c => c.session_id === sessionId)
    if (conv) {
      setSessionMessages(conv.messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ))
      setSelectedSession(sessionId)
    }
  }

  const getExportData = () => {
    if (selected.size > 0) {
      return conversations.filter(c => selected.has(c.session_id))
    }
    return conversations
  }

  const exportCSV = () => {
    const data = getExportData()
    const headers = ['Date', 'User', 'Exercise', 'Model', 'Default Temp', 'Exercise Temp', 'Messages', 'Full Conversation']
    const rows = data.map(c => [
      new Date(c.created_at).toISOString().split('T')[0],
      c.user?.full_name || c.user?.email || 'Unknown',
      c.exercise?.title || 'N/A',
      c.model?.display_name || c.model?.name || 'Unknown',
      c.model_temperature ?? 0.7,
      c.temperature_override !== null && c.temperature_override !== undefined ? c.temperature_override : '',
      c.message_count,
      `"${c.messages.map(m => `[${m.prompt}] -> [${m.response || ''}]`).join(' | ').replace(/"/g, '""')}"`
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    downloadFile(csv, 'text/csv', `conversations-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const exportJSON = () => {
    const data = getExportData().map(c => ({
      session_id: c.session_id,
      date: c.created_at,
      user: c.user?.full_name || c.user?.email || 'Unknown',
      exercise: c.exercise?.title || 'N/A',
      model: c.model?.display_name || c.model?.name || 'Unknown',
      model_temperature: c.model_temperature ?? 0.7,
      temperature_override: c.temperature_override,
      effective_temperature: c.temperature_override ?? c.model_temperature ?? 0.7,
      message_count: c.message_count,
      messages: c.messages.map(m => ({
        timestamp: m.created_at,
        prompt: m.prompt,
        response: m.response,
        tokens: m.token_count
      }))
    }))
    downloadFile(JSON.stringify(data, null, 2), 'application/json', `conversations-${new Date().toISOString().split('T')[0]}.json`)
  }

  const exportFullThreadsCSV = () => {
    const data = getExportData()
    const headers = ['Session ID', 'Date', 'User', 'Exercise', 'Model', 'Default Temp', 'Exercise Temp', 'Speaker', 'Content', 'Tokens']
    const rows: string[][] = []
    data.forEach(c => {
      const modelTemp = c.model_temperature ?? 0.7
      const overrideTemp = c.temperature_override !== null && c.temperature_override !== undefined ? c.temperature_override : ''
      c.messages.forEach((m, idx) => {
        rows.push([
          c.session_id,
          new Date(m.created_at).toISOString().replace('T', ' ').slice(0, 19),
          c.user?.full_name || c.user?.email || 'Unknown',
          c.exercise?.title || 'N/A',
          c.model?.display_name || c.model?.name || 'Unknown',
          String(modelTemp),
          String(overrideTemp),
          'User',
          `"${(m.prompt || '').replace(/"/g, '""')}"`,
          ''
        ])
        if (m.response) {
          rows.push([
            c.session_id,
            new Date(m.created_at).toISOString().replace('T', ' ').slice(0, 19),
            c.user?.full_name || c.user?.email || 'Unknown',
            c.exercise?.title || 'N/A',
            c.model?.display_name || c.model?.name || 'Unknown',
            String(modelTemp),
            String(overrideTemp),
            'AI',
            `"${(m.response || '').replace(/"/g, '""')}"`,
            String(m.token_count || '')
          ])
        }
      })
    })
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    downloadFile(csv, 'text/csv', `conversations-full-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const exportStats = () => {
    const data = getExportData()
    const byUser: Record<string, number> = {}
    const byModel: Record<string, number> = {}
    const byExercise: Record<string, number> = {}
    
    data.forEach(c => {
      const user = c.user?.full_name || c.user?.email || 'Unknown'
      const model = c.model?.display_name || c.model?.name || 'Unknown'
      const exercise = c.exercise?.title || 'N/A'
      byUser[user] = (byUser[user] || 0) + c.message_count
      byModel[model] = (byModel[model] || 0) + c.message_count
      byExercise[exercise] = (byExercise[exercise] || 0) + c.message_count
    })
    
    const stats = {
      total_conversations: data.length,
      total_messages: data.reduce((sum, c) => sum + c.message_count, 0),
      by_user: byUser,
      by_model: byModel,
      by_exercise: byExercise,
      exported_at: new Date().toISOString()
    }
    downloadFile(JSON.stringify(stats, null, 2), 'application/json', `conversation-stats-${new Date().toISOString().split('T')[0]}.json`)
  }

  const downloadFile = (content: string, type: string, filename: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSelect = (sessionId: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId)
    } else {
      newSelected.add(sessionId)
    }
    setSelected(newSelected)
  }

  const toggleSelectAll = () => {
    if (selected.size === conversations.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(conversations.map(c => c.session_id)))
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href="/admin"><ArrowLeft className="h-4 w-4 mr-2" />Back to Admin</Link>
            </Button>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-8 w-8" />
                  Manage Conversations
                </h1>
                <p className="text-muted-foreground mt-1">View all participant interactions with AI models</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export {selected.size > 0 ? `(${selected.size})` : ''}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />CSV (Summary)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportFullThreadsCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />CSV (Full Threads)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportJSON}>
                    <FileJson className="h-4 w-4 mr-2" />JSON (Full Data)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportStats}>
                    <FileJson className="h-4 w-4 mr-2" />JSON (Stats Only)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{total}</div>
                <div className="text-sm text-muted-foreground">Conversations</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{allData.length}</div>
                <div className="text-sm text-muted-foreground">Total Messages</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search prompts or responses..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={exerciseFilter}
                  onChange={(e) => { setExerciseFilter(e.target.value); setPage(1) }}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="">All Exercises</option>
                  {exercises.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                    className="w-36"
                    placeholder="From"
                  />
                  <span>-</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                    className="w-36"
                    placeholder="To"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversations Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No conversations found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="py-3 px-4 w-10">
                          <Checkbox 
                            checked={selected.size === conversations.length && conversations.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">User</th>
                        <th className="text-left py-3 px-4">Exercise</th>
                        <th className="text-left py-3 px-4">Model</th>
                        <th className="text-left py-3 px-4">Messages</th>
                        <th className="text-left py-3 px-4">Preview</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversations.map((c) => (
                        <tr key={c.session_id} className="border-b hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <Checkbox 
                              checked={selected.has(c.session_id)}
                              onCheckedChange={() => toggleSelect(c.session_id)}
                            />
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {new Date(c.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            {c.user?.full_name || c.user?.email?.split('@')[0] || 'Unknown'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{c.exercise?.title || 'N/A'}</Badge>
                          </td>
                          <td className="py-3 px-4">{c.model?.display_name || c.model?.name || 'Unknown'}</td>
                          <td className="py-3 px-4">
                            <Badge>{c.message_count}</Badge>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                            {c.messages[0]?.prompt}
                          </td>
                          <td className="py-3 px-4">
                            <Button size="sm" variant="ghost" onClick={() => fetchSessionMessages(c.session_id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({total} conversations)
                  </div>
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
            </CardContent>
          </Card>

          {/* Session Detail Modal */}
          {selectedSession && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedSession(null)}>
              <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Conversation Detail</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedSession(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[60vh]">
                  <div className="space-y-4">
                    {sessionMessages.map((msg) => (
                      <div key={msg.id} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="bg-primary text-primary-foreground rounded-full p-2">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex-1 bg-muted rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">
                              {msg.user?.full_name || msg.user?.email} • {new Date(msg.created_at).toLocaleString()}
                            </div>
                            <div>{msg.prompt}</div>
                          </div>
                        </div>
                        {msg.response && (
                          <div className="flex items-start gap-2">
                            <div className="bg-secondary rounded-full p-2">
                              <Bot className="h-4 w-4" />
                            </div>
                            <div className="flex-1 bg-secondary/50 rounded-lg p-3">
                              <div className="text-xs text-muted-foreground mb-1">
                                {msg.model?.display_name || msg.model?.name}
                              </div>
                              <div className="whitespace-pre-wrap">{msg.response}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  )
}
