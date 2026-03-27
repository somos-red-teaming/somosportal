'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import ConstellationGraph from '@/components/ConstellationGraph'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react'
import Link from 'next/link'

interface ClusterData {
  id: string
  name: string
  totalCount: number
  avgSeverity: number
  nodeCount: number
}

interface NodeData {
  id: string
  category: string
  severity: number
  status: string
  modelName: string
  exerciseTitle: string
  promptPreview: string
  responsePreview: string
}

interface LinkData {
  source: string
  target: string
}

interface Exercise {
  id: string
  title: string
}

const categoryLabels: Record<string, string> = {
  harmful_content: 'Harmful Content',
  misinformation: 'Misinformation',
  bias_discrimination: 'Bias & Discrimination',
  privacy_violation: 'Privacy Violation',
  inappropriate_response: 'Inappropriate',
  factual_error: 'Factual Error',
  off_topic: 'Off Topic',
  spam: 'Spam',
  other: 'Other',
}

const CLUSTER_COLORS = [
  '#F3D59D',
  '#B5D3C7',
  '#FABBA3',
  '#D5C1C3',
  '#E7E8E5',
  '#A8C8E8',
  '#C4D9A0',
  '#E8B8D4',
]

type SeverityBucketKey = 'low' | 'warning' | 'critical'

const SEVERITY_LEGEND: Array<{
  key: SeverityBucketKey
  label: string
  severity: number
  color: string
  description: string
}> = [
  { key: 'low', label: 'Low', severity: 2, color: '#34d399', description: 'Severity 1–4 · Informational signals to track patterns.' },
  { key: 'warning', label: 'Warning', severity: 5, color: '#facc15', description: 'Severity 5–7 · Medium risk issues that need monitoring.' },
  { key: 'critical', label: 'Critical', severity: 9, color: '#f87171', description: 'Severity 8–10 · High risk flags that require immediate attention.' },
]

const getLegendRadius = (severity: number) => {
  const min = 4
  const max = 28
  const clamped = Math.max(1, Math.min(10, severity))
  return min + ((clamped - 1) / 9) * (max - min)
}

export default function DeliberationPage() {
  const [clusters, setClusters] = useState<ClusterData[]>([])
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [links, setLinks] = useState<LinkData[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exerciseId, setExerciseId] = useState('')
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)

  useEffect(() => {
    fetchExercises()
  }, [])

  useEffect(() => {
    fetchClusters()
  }, [exerciseId])

  const fetchExercises = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase.from('exercises').select('id, title').order('title')
    setExercises(data || [])
  }

  const fetchClusters = async () => {
    setLoading(true)
    try {
      const params = exerciseId ? `?exercise_id=${exerciseId}` : ''
      const res = await fetch(`/api/flags/admin/clusters${params}`)
      const data = await res.json()
      setClusters(data.clusters || [])
      setNodes(data.nodes || [])
      setLinks(data.links || [])
    } catch (e) {
      // Silently fail - empty state handles no data
    }
    setLoading(false)
  }

  const handleClusterClick = useCallback((category: string) => {
    setSelectedCluster(prev => prev === category ? null : category)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  // Filter nodes/links when a cluster is selected
  const visibleNodes = selectedCluster
    ? nodes.filter(n => n.category === selectedCluster)
    : nodes
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id))
  const visibleLinks = links.filter(l => visibleNodeIds.has(l.source) && visibleNodeIds.has(l.target))
  const visibleClusters = selectedCluster
    ? clusters.filter(c => c.id === selectedCluster)
    : clusters
  const totalClusterFlags = clusters.reduce((sum, c) => sum + c.totalCount, 0)
  const exerciseSelectValue = exerciseId || 'all'
  const selectedClusterData = selectedCluster ? clusters.find(c => c.id === selectedCluster) || null : null
  const selectedClusterNodes = selectedCluster ? nodes.filter(n => n.category === selectedCluster) : []
  const severityBuckets = selectedClusterNodes.reduce<Record<SeverityBucketKey, number>>(
    (acc, node) => {
      if (node.severity >= 8) acc.critical++
      else if (node.severity >= 5) acc.warning++
      else acc.low++
      return acc
    },
    { critical: 0, warning: 0, low: 0 }
  )
  const highlightedNodes = [...selectedClusterNodes]
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 5)
  const severityBandsDisplay = [...SEVERITY_LEGEND].reverse()

  return (
    <AdminRoute>
      <div className={`flex flex-col ${fullscreen ? 'h-screen' : 'min-h-screen'} bg-[#03030a]`}>
        {!fullscreen && <Header />}

        {/* Controls */}
        <div className="px-4 py-5 bg-gradient-to-b from-[#050509] via-[#050509]/95 to-[#050509]/85 border-b border-white/5">
          <div className="w-full max-w-6xl mx-auto">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-5 backdrop-blur-md shadow-[0px_25px_60px_rgba(0,0,0,0.35)] flex flex-col gap-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  {!fullscreen && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="text-white/70 hover:text-white bg-white/5 border border-white/10 rounded-full"
                    >
                      <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                  )}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-white font-semibold text-2xl tracking-tight">Deliberation Map</h1>
                      {selectedCluster && (
                        <span className="text-[11px] uppercase tracking-wide text-white/80 bg-white/10 px-3 py-1 rounded-full">
                          {categoryLabels[selectedCluster] || selectedCluster}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70 max-w-2xl">
                      Active harms constellation for facilitators. Choose an exercise to scope the clusters.
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white/80 hover:text-white rounded-full border border-white/15 bg-white/5 px-4 py-2"
                >
                  {fullscreen ? (
                    <span className="flex items-center gap-2">
                      <Minimize2 className="h-4 w-4" /> Exit full screen
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Maximize2 className="h-4 w-4" /> Full screen
                    </span>
                  )}
                </Button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 min-w-[240px]">
                  <p className="text-[11px] uppercase tracking-wide text-white/60 mb-1">Exercise scope</p>
                  <Select
                    value={exerciseSelectValue}
                    onValueChange={(value) => setExerciseId(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-11 bg-white/5 border border-white/20 text-white/90 rounded-2xl">
                      <SelectValue placeholder="All exercises" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#050509] text-white border border-white/10 max-h-72">
                      <SelectItem value="all">All Exercises</SelectItem>
                      {exercises.map(ex => (
                        <SelectItem key={ex.id} value={ex.id}>{ex.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCluster && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCluster(null)}
                      className="rounded-full border-white/30 text-white/80 bg-white/5 hover:bg-white/10"
                    >
                      ✕ Clear cluster filter
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-4 bg-[#050509] border-b border-white/5 space-y-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-white/50">
              <span>Clusters</span>
              <span className="text-white/30 normal-case font-normal tracking-normal">Tap to focus</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {clusters.map((c, i) => {
                const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length]
                const percent = totalClusterFlags ? Math.round((c.totalCount / totalClusterFlags) * 100) : 0
                const isMuted = selectedCluster && selectedCluster !== c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => handleClusterClick(c.id)}
                    className={`flex items-center gap-3 rounded-full border px-4 py-2 min-w-[220px] text-left transition ${isMuted ? 'opacity-40' : 'opacity-100'} ${selectedCluster === c.id ? 'bg-white/10 border-white/50 shadow-[0_15px_35px_rgba(0,0,0,0.45)]' : 'bg-white/5 border-white/15 hover:bg-white/10'}`}
                    aria-pressed={selectedCluster === c.id}
                  >
                    <span className="w-3.5 h-3.5 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.35)]" style={{ backgroundColor: color }} />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{categoryLabels[c.id] || c.id}</span>
                      <span className="text-[11px] uppercase tracking-wide text-white/60">{c.totalCount} flags</span>
                    </div>
                    <span className="ml-auto text-xs font-mono tracking-tight text-white px-2 py-0.5 rounded-full bg-white/15">
                      {percent}%
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <span className="text-xs uppercase tracking-wide text-white/50 shrink-0">Severity scale</span>
            <div className="flex flex-wrap items-center gap-6 text-white/80">
              {SEVERITY_LEGEND.map(stop => {
                const diameter = getLegendRadius(stop.severity) * 2
                return (
                  <Tooltip key={stop.label}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-3 text-sm cursor-help">
                        <span className="text-white/60">{stop.label}</span>
                        <span
                          className="rounded-full border border-white/30 bg-white/10 block"
                          style={{
                            width: `${diameter}px`,
                            height: `${diameter}px`,
                            boxShadow: stop.severity >= 8 ? '0 0 18px rgba(250,187,163,0.6)' : '0 0 12px rgba(255,255,255,0.15)',
                          }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white text-black text-xs px-3 py-2">
                      {stop.description}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
            <span className="text-xs text-white/40 ml-auto">Node size ∝ severity</span>
          </div>
        </div>

        {/* Graph + Details */}
        <div className="flex-1 relative flex flex-col lg:flex-row" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="relative flex-1">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center text-white/50">
                Loading constellation...
              </div>
            )}
            <ConstellationGraph
              clusters={visibleClusters}
              nodes={visibleNodes}
              links={visibleLinks}
              onClusterClick={handleClusterClick}
            />
          </div>

          {selectedClusterData && (
            <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#090912] text-white flex flex-col">
              <div className="flex items-start justify-between p-4 border-b border-white/5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">Cluster</p>
                  <h3 className="text-lg font-semibold">{categoryLabels[selectedClusterData.id] || selectedClusterData.id}</h3>
                  <p className="text-sm text-white/60">{selectedClusterData.totalCount} flags · avg severity {selectedClusterData.avgSeverity}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedCluster(null)}
                  className="text-white/60 hover:text-white rounded-full"
                >
                  ✕
                </Button>
              </div>

              <div className="p-4 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-white/50">Flags</p>
                    <p className="text-2xl font-semibold">{selectedClusterData.totalCount}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-white/50">Nodes visualized</p>
                    <p className="text-2xl font-semibold">{selectedClusterData.nodeCount}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 col-span-2">
                    <p className="text-[11px] uppercase tracking-wide text-white/50">Status mix</p>
                    <p className="text-base text-white/80">{selectedClusterNodes.filter(n => n.status === 'resolved').length} resolved · {selectedClusterNodes.filter(n => n.status === 'pending').length} open</p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/50 mb-2">Severity mix</p>
                  <div className="space-y-2">
                    {severityBandsDisplay.map(bucket => {
                      const value = severityBuckets[bucket.key]
                      return (
                        <Tooltip key={bucket.label}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-3 cursor-help">
                              <span className="text-sm text-white/70 w-16">{bucket.label}</span>
                              <div className="flex-1 h-2 rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: selectedClusterNodes.length ? `${(value / selectedClusterNodes.length) * 100}%` : '0%',
                                    backgroundColor: bucket.color,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-white/60 w-8 text-right">{value}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white text-black text-xs px-3 py-2">
                            {bucket.description}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/50 mb-3">Top prompts</p>
                  <div className="space-y-3">
                    {highlightedNodes.length === 0 && (
                      <p className="text-sm text-white/50">No nodes within this cluster yet.</p>
                    )}
                    {highlightedNodes.map(node => (
                      <div key={node.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>Severity {node.severity}</span>
                          <span className="uppercase tracking-wide">{node.status}</span>
                        </div>
                        {node.promptPreview && (
                          <p className="text-sm text-white/80">&ldquo;{node.promptPreview}...&rdquo;</p>
                        )}
                        {node.responsePreview && (
                          <p className="text-xs text-white/50">AI: {node.responsePreview}...</p>
                        )}
                        <p className="text-xs text-white/40">{node.modelName} · {node.exerciseTitle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-6 px-4 py-2 bg-[#050509] border-t border-white/10 text-xs text-white/50">
          <span>{nodes.length} flags visualized</span>
          <span>{clusters.length} categories</span>
          <span>{clusters.reduce((sum, c) => sum + c.totalCount, 0)} total flags</span>
          <span className="ml-auto">Scroll to zoom · Drag to pan · Click cluster to filter</span>
        </div>
      </div>
    </AdminRoute>
  )
}
