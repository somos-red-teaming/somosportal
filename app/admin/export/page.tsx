'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { ArrowLeft, Download, FileJson, FileSpreadsheet, Flag, MessageSquare, ClipboardList } from 'lucide-react'
import Link from 'next/link'

export default function AdminExportPage() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = async (type: 'flags' | 'interactions' | 'exercises', format: 'csv' | 'json') => {
    setLoading(`${type}-${format}`)
    
    const params = new URLSearchParams()
    params.set('format', format)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)

    const res = await fetch(`/api/export/${type}?${params}`)
    
    if (format === 'csv') {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-export.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-export.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    
    setLoading(null)
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-3xl font-bold">Data Export</h1>
          </div>

          {/* Date Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Date Range (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div>
                  <Label>From</Label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
                </div>
                <div>
                  <Label>To</Label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
                </div>
                {(fromDate || toDate) && (
                  <Button variant="ghost" onClick={() => { setFromDate(''); setToDate('') }} className="self-end">
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-red-500" />
                  Flags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Export all flagged content with categories, severity, and reviewer notes.</p>
                <div className="flex gap-2">
                  <Button onClick={() => handleExport('flags', 'csv')} disabled={loading === 'flags-csv'} className="flex-1">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    {loading === 'flags-csv' ? 'Exporting...' : 'CSV'}
                  </Button>
                  <Button onClick={() => handleExport('flags', 'json')} disabled={loading === 'flags-json'} variant="outline" className="flex-1">
                    <FileJson className="h-4 w-4 mr-1" />
                    {loading === 'flags-json' ? 'Exporting...' : 'JSON'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Interactions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Export AI conversations with prompts, responses, and model info.</p>
                <div className="flex gap-2">
                  <Button onClick={() => handleExport('interactions', 'csv')} disabled={loading === 'interactions-csv'} className="flex-1">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    {loading === 'interactions-csv' ? 'Exporting...' : 'CSV'}
                  </Button>
                  <Button onClick={() => handleExport('interactions', 'json')} disabled={loading === 'interactions-json'} variant="outline" className="flex-1">
                    <FileJson className="h-4 w-4 mr-1" />
                    {loading === 'interactions-json' ? 'Exporting...' : 'JSON'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-green-500" />
                  Exercises
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Export exercises with participant counts and flag statistics.</p>
                <div className="flex gap-2">
                  <Button onClick={() => handleExport('exercises', 'csv')} disabled={loading === 'exercises-csv'} className="flex-1">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    {loading === 'exercises-csv' ? 'Exporting...' : 'CSV'}
                  </Button>
                  <Button onClick={() => handleExport('exercises', 'json')} disabled={loading === 'exercises-json'} variant="outline" className="flex-1">
                    <FileJson className="h-4 w-4 mr-1" />
                    {loading === 'exercises-json' ? 'Exporting...' : 'JSON'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}
