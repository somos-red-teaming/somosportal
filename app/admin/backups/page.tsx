'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { ArrowLeft, Database, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, Download, HardDrive } from 'lucide-react'
import Link from 'next/link'

interface BackupRun {
  id: number
  status: string
  conclusion: string | null
  created_at: string
  updated_at: string
  trigger: string
  url: string
}

interface BackupFile {
  id: string
  name: string
  size: string
  createdTime: string
}

export default function BackupsPage() {
  const [runs, setRuns] = useState<BackupRun[]>([])
  const [files, setFiles] = useState<BackupFile[]>([])
  const [loadingRuns, setLoadingRuns] = useState(true)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [backupStatus, setBackupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [showConfirm, setShowConfirm] = useState(false)

  const fetchRuns = useCallback(async () => {
    setLoadingRuns(true)
    try {
      const res = await fetch('/api/admin/backup/list')
      const data = await res.json()
      if (data.runs) setRuns(data.runs)
      if (data.files) setFiles(data.files)
    } catch { /* ignore */ }
    setLoadingRuns(false)
  }, [])

  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true)
    try {
      const res = await fetch('/api/admin/backup/list')
      const data = await res.json()
      if (data.files) setFiles(data.files)
    } catch { /* ignore */ }
    setLoadingFiles(false)
  }, [])

  useEffect(() => { fetchRuns(); fetchFiles() }, [fetchRuns, fetchFiles])

  const triggerBackup = async () => {
    setBackupStatus('loading')
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST' })
      if (res.ok) {
        setBackupStatus('success')
        setTimeout(() => { setBackupStatus('idle'); fetchRuns() }, 3000)
      } else {
        setBackupStatus('error')
        setTimeout(() => setBackupStatus('idle'), 5000)
      }
    } catch {
      setBackupStatus('error')
      setTimeout(() => setBackupStatus('idle'), 5000)
    }
  }

  const formatSize = (bytes: string) => {
    const b = parseInt(bytes)
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(1)} MB`
  }

  const statusIcon = (run: BackupRun) => {
    if (run.status === 'in_progress' || run.status === 'queued') return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
    if (run.conclusion === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const statusLabel = (run: BackupRun) => {
    if (run.status === 'in_progress') return 'Running'
    if (run.status === 'queued') return 'Queued'
    return run.conclusion === 'success' ? 'Success' : run.conclusion || 'Unknown'
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
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <img src="/icons/data-backup.png" alt="Backup" className="h-8 w-8" />
                Database Backups
              </h1>
              <p className="text-muted-foreground mt-1">Backups run daily at 2 AM UTC to Google Drive</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { fetchRuns(); fetchFiles() }} disabled={loadingRuns || loadingFiles} className="cursor-pointer">
                <RefreshCw className={`h-4 w-4 mr-1 ${loadingRuns || loadingFiles ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setShowConfirm(true)} disabled={backupStatus === 'loading'} className="cursor-pointer">
                <Database className="h-4 w-4 mr-1" />
                {backupStatus === 'loading' ? 'Triggering...' :
                 backupStatus === 'success' ? '✅ Triggered' :
                 backupStatus === 'error' ? '❌ Failed' :
                 'Backup Now'}
              </Button>
            </div>
          </div>

          {/* Backup Files from Google Drive */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Backup Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFiles ? (
                <p className="text-muted-foreground">Loading files...</p>
              ) : files.length === 0 ? (
                <p className="text-muted-foreground">No backup files found on Google Drive.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">File</th>
                        <th className="text-left p-2">Size</th>
                        <th className="text-left p-2">Created</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono text-sm">{file.name}</td>
                          <td className="p-2 text-sm text-muted-foreground">{formatSize(file.size)}</td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {new Date(file.createdTime).toLocaleString()}
                          </td>
                          <td className="p-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => {
                                window.open(`/api/admin/backup/download?fileId=${file.id}&fileName=${file.name}`, '_blank')
                              }}
                            >
                              <Download className="h-3.5 w-3.5 mr-1" />
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Runs */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow History</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRuns ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : runs.length === 0 ? (
                <p className="text-muted-foreground">No workflow runs found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Trigger</th>
                        <th className="text-left p-2">Started</th>
                        <th className="text-left p-2">Completed</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((run) => (
                        <tr key={run.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {statusIcon(run)}
                              <span className="capitalize">{statusLabel(run)}</span>
                            </div>
                          </td>
                          <td className="p-2">{run.trigger}</td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {new Date(run.created_at).toLocaleString()}
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {run.status === 'completed'
                              ? new Date(run.updated_at).toLocaleString()
                              : '—'}
                          </td>
                          <td className="p-2">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={run.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                View
                              </a>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirmation Dialog */}
          {showConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <img src="/icons/data-backup.png" alt="Backup" className="h-6 w-6" />
                    Confirm Backup
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">This will trigger a database backup to Google Drive via GitHub Actions. Continue?</p>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
                    <Button onClick={() => { setShowConfirm(false); triggerBackup() }}>Yes, Backup Now</Button>
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
