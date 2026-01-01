'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Search, ChevronLeft, ChevronRight, Flag, AlertTriangle, CheckCircle, XCircle, Clock, Download, Eye, X } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface FlagData {
  id: string
  category: string
  severity: number
  title: string
  description: string
  evidence: { 
    modelId?: string
    categories?: string[]
    conversation?: { type: string; content: string; timestamp?: string }[]
    conversationLength?: number
    timestamp?: string 
  }
  status: string
  reviewer_notes: string | null
  created_at: string
  reviewed_at: string | null
  user: { email: string; full_name: string | null } | null
  model: { name: string; blind_name: string } | null
  interaction: { 
    prompt: string
    response: string | null
    model: { name: string; blind_name: string } | null
    exercise: { title: string } | null
  } | null
}

interface Stats {
  total: number
  pending: number
  under_review: number
  resolved: number
  dismissed: number
  bySeverity: { high: number; medium: number; low: number }
  byCategory: { name: string; count: number }[]
  byModel: { name: string; count: number }[]
  byUser: { name: string; count: number }[]
}

const PAGE_SIZE = 10

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  under_review: 'bg-blue-500',
  resolved: 'bg-green-500',
  dismissed: 'bg-gray-500',
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  under_review: <Eye className="h-3 w-3" />,
  resolved: <CheckCircle className="h-3 w-3" />,
  dismissed: <XCircle className="h-3 w-3" />,
}

const categoryLabels: Record<string, string> = {
  harmful_content: 'Harmful Content',
  misinformation: 'Misinformation',
  bias_discrimination: 'Bias/Discrimination',
  privacy_violation: 'Privacy Violation',
  inappropriate_response: 'Inappropriate',
  factual_error: 'Factual Error',
  off_topic: 'Off Topic',
  spam: 'Spam',
  other: 'Other',
}

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<FlagData[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, under_review: 0, resolved: 0, dismissed: 0, bySeverity: { high: 0, medium: 0, low: 0 }, byCategory: [], byModel: [], byUser: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedFlag, setSelectedFlag] = useState<FlagData | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchFlags()
  }, [page, search, statusFilter, categoryFilter])

  const fetchStats = async () => {
    // Fetch flags with model info via admin API
    const res = await fetch('/api/flags/admin?page=1&limit=1000')
    const { flags: data } = await res.json()
    
    if (data) {
      const s: Stats = { 
        total: data.length, pending: 0, under_review: 0, resolved: 0, dismissed: 0, 
        bySeverity: { high: 0, medium: 0, low: 0 },
        byCategory: [],
        byModel: [],
        byUser: []
      }
      
      const categoryCount: Record<string, number> = {}
      const modelCount: Record<string, number> = {}
      const userCount: Record<string, number> = {}
      
      data.forEach((f: FlagData) => {
        if (f.status === 'pending') s.pending++
        else if (f.status === 'under_review') s.under_review++
        else if (f.status === 'resolved') s.resolved++
        else if (f.status === 'dismissed') s.dismissed++
        if (f.severity >= 8) s.bySeverity.high++
        else if (f.severity >= 5) s.bySeverity.medium++
        else s.bySeverity.low++
        
        // Count by category
        const cats = f.evidence?.categories || [f.category]
        cats.forEach(cat => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1
        })
        
        // Count by model
        const modelName = f.model?.name || 'Unknown'
        modelCount[modelName] = (modelCount[modelName] || 0) + 1
        
        // Count by user
        const userName = f.user?.full_name || f.user?.email || 'Unknown'
        userCount[userName] = (userCount[userName] || 0) + 1
      })
      
      s.byCategory = Object.entries(categoryCount)
        .map(([name, count]) => ({ name: categoryLabels[name] || name, count }))
        .sort((a, b) => b.count - a.count)
      
      s.byModel = Object.entries(modelCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
      
      s.byUser = Object.entries(userCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Top 10 users
      
      setStats(s)
    }
  }

  const fetchFlags = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', page.toString())
    params.set('limit', PAGE_SIZE.toString())
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (categoryFilter) params.set('category', categoryFilter)

    const res = await fetch(`/api/flags/admin?${params}`)
    const { flags: data, total: count } = await res.json()

    setFlags(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  const updateStatus = async (flagId: string, newStatus: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: dbUser } = await supabase.from('users').select('id').eq('auth_user_id', user?.id).single()
    
    await supabase.from('flags').update({
      status: newStatus,
      reviewed_by: dbUser?.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewNotes || null,
    }).eq('id', flagId)
    
    setSelectedFlag(null)
    setReviewNotes('')
    fetchFlags()
    fetchStats()
  }

  const exportFlags = async (format: 'csv' | 'json') => {
    const res = await fetch('/api/flags/admin?page=1&limit=1000')
    const { flags: data } = await res.json()

    if (!data || data.length === 0) {
      alert('No flags to export')
      return
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      downloadBlob(blob, 'flags-export.json')
    } else {
      const headers = ['ID', 'Category', 'Severity', 'Status', 'Description', 'Exercise', 'Model', 'Submitted By', 'Created', 'Reviewed']
      const rows = data.map((f: FlagData) => [
        f.id,
        f.evidence?.categories?.join('; ') || f.category,
        f.severity,
        f.status,
        `"${(f.description || '').replace(/"/g, '""')}"`,
        f.interaction?.exercise?.title || '',
        f.model?.name || '',
        f.user?.email || '',
        f.created_at,
        f.reviewed_at || '',
      ])
      const csv = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n')
      downloadBlob(new Blob([csv], { type: 'text/csv' }), 'flags-export.csv')
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
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
            <h1 className="text-3xl font-bold">Flag Management</h1>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
            </Card>
            <Card className="border-yellow-500/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-yellow-500">{stats.pending}</div></CardContent>
            </Card>
            <Card className="border-blue-500/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Under Review</CardTitle>
                <Eye className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-blue-500">{stats.under_review}</div></CardContent>
            </Card>
            <Card className="border-green-500/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-500">{stats.resolved}</div></CardContent>
            </Card>
            <Card className="border-red-500/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">High Severity</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-500">{stats.bySeverity.high}</div></CardContent>
            </Card>
          </div>

          {/* Charts */}
          {(stats.byCategory.length > 0 || stats.byModel.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Flags by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.byCategory} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {stats.byCategory.map((_, index) => (
                          <Cell key={index} fill={['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#14b8a6'][index % 9]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Flags by Model</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.byModel} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Top Submitters</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.byUser} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Export */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search flags..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
                </div>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="border rounded-md px-3 py-2 bg-background">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="border rounded-md px-3 py-2 bg-background">
                  <option value="">All Categories</option>
                  {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportFlags('csv')}><Download className="h-4 w-4 mr-1" />CSV</Button>
                  <Button variant="outline" size="sm" onClick={() => exportFlags('json')}><Download className="h-4 w-4 mr-1" />JSON</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flags Table */}
          <Card>
            <CardHeader>
              <CardTitle>Flags ({total})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : flags.length === 0 ? (
                <p className="text-muted-foreground">No flags found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Severity</th>
                        <th className="text-left p-2">Exercise</th>
                        <th className="text-left p-2">Model</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Created</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flags.map((flag) => (
                        <tr key={flag.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1">
                              {(flag.evidence?.categories || [flag.category]).slice(0, 2).map(cat => (
                                <Badge key={cat} variant="outline" className="text-xs">{categoryLabels[cat] || cat}</Badge>
                              ))}
                              {(flag.evidence?.categories?.length || 1) > 2 && (
                                <Badge variant="outline" className="text-xs">+{(flag.evidence?.categories?.length || 1) - 2}</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <span className={`font-medium ${flag.severity >= 8 ? 'text-red-500' : flag.severity >= 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                              {flag.severity}/10
                            </span>
                          </td>
                          <td className="p-2 max-w-[150px] truncate">{flag.interaction?.exercise?.title || '-'}</td>
                          <td className="p-2">{flag.model?.name || flag.interaction?.model?.name || '-'}</td>
                          <td className="p-2">
                            <Badge className={`${statusColors[flag.status]} text-white`}>
                              {statusIcons[flag.status]} <span className="ml-1">{flag.status.replace('_', ' ')}</span>
                            </Badge>
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">{new Date(flag.created_at).toLocaleDateString()}</td>
                          <td className="p-2">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedFlag(flag); setReviewNotes(flag.reviewer_notes || '') }}>
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
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Flag Detail Modal */}
        {selectedFlag && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Flag Details</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedFlag(null)}><X className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <div className="flex flex-wrap gap-1">
                      {(selectedFlag.evidence?.categories || [selectedFlag.category]).map(cat => (
                        <Badge key={cat} variant="outline">{categoryLabels[cat] || cat}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Severity</p>
                    <span className={`font-bold ${selectedFlag.severity >= 8 ? 'text-red-500' : selectedFlag.severity >= 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {selectedFlag.severity}/10
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Exercise</p>
                    <p>{selectedFlag.interaction?.exercise?.title || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p>{selectedFlag.model?.name || selectedFlag.interaction?.model?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted By</p>
                    <p>{selectedFlag.user?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={`${statusColors[selectedFlag.status]} text-white`}>{selectedFlag.status.replace('_', ' ')}</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="bg-muted p-3 rounded-md">{selectedFlag.description}</p>
                </div>

                {/* Full Conversation */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Flagged Conversation</p>
                  <div className="bg-muted p-3 rounded-md space-y-3 max-h-64 overflow-y-auto">
                    {selectedFlag.evidence?.conversation ? (
                      selectedFlag.evidence.conversation.map((msg, i) => (
                        <div key={i} className={`${msg.type === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                          <span className="font-medium">{msg.type === 'user' ? 'User:' : 'AI:'}</span>{' '}
                          <span className="text-foreground">{msg.content}</span>
                        </div>
                      ))
                    ) : selectedFlag.interaction ? (
                      <>
                        <div><span className="font-medium text-blue-600">User:</span> {selectedFlag.interaction.prompt}</div>
                        {selectedFlag.interaction.response && (
                          <div><span className="font-medium text-green-600">AI:</span> {selectedFlag.interaction.response}</div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">No conversation data</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reviewer Notes</p>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full border rounded-md p-2 bg-background"
                    rows={3}
                    placeholder="Add notes about this flag..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => updateStatus(selectedFlag.id, 'under_review')} disabled={selectedFlag.status === 'under_review'}>
                    <Eye className="h-4 w-4 mr-1" /> Mark Under Review
                  </Button>
                  <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(selectedFlag.id, 'resolved')}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                  </Button>
                  <Button variant="secondary" onClick={() => updateStatus(selectedFlag.id, 'dismissed')}>
                    <XCircle className="h-4 w-4 mr-1" /> Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminRoute>
  )
}
