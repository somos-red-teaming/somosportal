'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import ConstellationGraph from '@/components/ConstellationGraph'
import { Button } from '@/components/ui/button'
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

  return (
    <AdminRoute>
      <div className={`flex flex-col ${fullscreen ? 'h-screen' : 'min-h-screen'} bg-[#0a0a0f]`}>
        {!fullscreen && <Header />}

        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-[#0a0a0f] border-b border-white/10">
          <div className="flex items-center gap-3">
            {!fullscreen && (
              <Button variant="ghost" size="icon" asChild className="text-white/60 hover:text-white">
                <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
            )}
            <h1 className="text-white/90 font-semibold text-lg">Deliberation Map</h1>
          </div>

          <div className="flex items-center gap-3">
            {selectedCluster && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCluster(null)}
                className="text-white/60 hover:text-white text-xs"
              >
                ✕ Clear filter: {categoryLabels[selectedCluster] || selectedCluster}
              </Button>
            )}

            <select
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className="bg-white/10 text-white/80 text-sm border border-white/20 rounded px-3 py-1.5 w-full sm:w-auto"
            >
              <option value="">All Exercises</option>
              {exercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.title}</option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white/60 hover:text-white shrink-0"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 bg-[#0a0a0f] border-b border-white/5 overflow-x-auto">
          <span className="text-white/40 text-xs shrink-0">Clusters:</span>
          {clusters.map((c, i) => {
            const colors = ['#F3D59D', '#B5D3C7', '#FABBA3', '#D5C1C3', '#E7E8E5', '#A8C8E8', '#C4D9A0', '#E8B8D4']
            return (
              <button
                key={c.id}
                onClick={() => handleClusterClick(c.id)}
                className={`flex items-center gap-1.5 text-xs shrink-0 transition-opacity ${selectedCluster && selectedCluster !== c.id ? 'opacity-30' : 'opacity-100'}`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-white/70">{categoryLabels[c.id] || c.id} ({c.totalCount})</span>
              </button>
            )
          })}
          <span className="text-white/40 text-xs shrink-0 ml-4">Size = severity</span>
        </div>

        {/* Graph */}
        <div className="flex-1 relative" style={{ minHeight: 'calc(100vh - 200px)' }}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/40">
              Loading constellation...
            </div>
          ) : (
            <ConstellationGraph
              clusters={visibleClusters}
              nodes={visibleNodes}
              links={visibleLinks}
              onClusterClick={handleClusterClick}
            />
          )}
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-6 px-4 py-2 bg-[#0a0a0f] border-t border-white/10 text-xs text-white/40">
          <span>{nodes.length} flags visualized</span>
          <span>{clusters.length} categories</span>
          <span>{clusters.reduce((sum, c) => sum + c.totalCount, 0)} total flags</span>
          <span className="ml-auto">Scroll to zoom · Drag to pan · Click cluster to filter</span>
        </div>
      </div>
    </AdminRoute>
  )
}
