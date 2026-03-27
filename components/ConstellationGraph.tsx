'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'

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

interface ConstellationGraphProps {
  clusters: ClusterData[]
  nodes: NodeData[]
  links: LinkData[]
  onClusterClick?: (category: string) => void
}

// SOMOS brand palette for clusters
const CLUSTER_COLORS = [
  '#F3D59D', // gold/primary
  '#B5D3C7', // sage/accent
  '#FABBA3', // peach
  '#D5C1C3', // mauve
  '#E7E8E5', // warm gray
  '#A8C8E8', // soft blue
  '#C4D9A0', // soft green
  '#E8B8D4', // soft pink
]

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

export default function ConstellationGraph({ clusters, nodes, links, onClusterClick }: ConstellationGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const render = useCallback(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    const tooltip = d3.select(tooltipRef.current)

    // Color scale by category
    const colorScale = new Map(clusters.map((c, i) => [c.id, CLUSTER_COLORS[i % CLUSTER_COLORS.length]]))

    // Build simulation nodes with category grouping
    type SimNode = NodeData & d3.SimulationNodeDatum & { radius: number; color: string }
    type SimLink = d3.SimulationLinkDatum<SimNode>

    const simNodes: SimNode[] = nodes.map(n => ({
      ...n,
      radius: Math.max(3, Math.min(12, n.severity * 1.2)),
      color: colorScale.get(n.category) || '#666',
    }))

    const nodeMap = new Map(simNodes.map(n => [n.id, n]))
    const simLinks: SimLink[] = links
      .filter(l => nodeMap.has(l.source) && nodeMap.has(l.target))
      .map(l => ({ source: l.source, target: l.target }))

    // Cluster centers for force grouping
    const clusterCenters = new Map<string, { x: number; y: number }>()
    clusters.forEach((c, i) => {
      const angle = (i / clusters.length) * 2 * Math.PI
      const r = Math.min(width, height) * 0.3
      clusterCenters.set(c.id, {
        x: width / 2 + Math.cos(angle) * r,
        y: height / 2 + Math.sin(angle) * r,
      })
    })

    // Force simulation - tuned for large datasets
    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(20).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-15).distanceMax(150))
      .force('collision', d3.forceCollide<SimNode>().radius(d => d.radius + 1))
      .force('cluster', (alpha: number) => {
        // Custom force: pull nodes toward their cluster center
        for (const node of simNodes) {
          const center = clusterCenters.get(node.category)
          if (center && node.x !== undefined && node.y !== undefined) {
            node.vx = (node.vx || 0) + (center.x - node.x) * alpha * 0.15
            node.vy = (node.vy || 0) + (center.y - node.y) * alpha * 0.15
          }
        }
      })
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))

    // Zoom
    const zoomGroup = svg.append('g')
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on('zoom', (event) => zoomGroup.attr('transform', event.transform))
    svg.call(zoom)

    // Links
    const linkElements = zoomGroup.append('g')
      .selectAll('line')
      .data(simLinks)
      .enter().append('line')
      .attr('stroke', '#ffffff')
      .attr('stroke-opacity', 0.06)
      .attr('stroke-width', 0.5)

    // Nodes
    const nodeElements = zoomGroup.append('g')
      .selectAll('circle')
      .data(simNodes)
      .enter().append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.8)
      .attr('stroke', d => d.color)
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, SimNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.1).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null; d.fy = null
        })
      )

    // Hover tooltip
    nodeElements
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .transition().duration(150)
          .attr('r', d.radius * 1.8)
          .attr('fill-opacity', 1)

        tooltip
          .style('display', 'block')
          .style('left', `${event.pageX + 12}px`)
          .style('top', `${event.pageY - 12}px`)
          .html(`
            <div class="font-medium">${categoryLabels[d.category] || d.category}</div>
            <div class="text-xs opacity-70 mt-1">Severity: ${d.severity}/10 · ${d.modelName}</div>
            <div class="text-xs opacity-70">${d.exerciseTitle}</div>
            ${d.promptPreview ? `<div class="text-xs mt-1 opacity-50">"${d.promptPreview}..."</div>` : ''}
          `)
      })
      .on('mouseout', (event, d) => {
        d3.select(event.currentTarget)
          .transition().duration(150)
          .attr('r', d.radius)
          .attr('fill-opacity', 0.8)
        tooltip.style('display', 'none')
      })

    // Cluster labels
    clusters.forEach((cluster, i) => {
      const center = clusterCenters.get(cluster.id)
      if (!center) return
      const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length]

      // Glow circle behind cluster
      zoomGroup.append('circle')
        .attr('cx', center.x)
        .attr('cy', center.y)
        .attr('r', Math.max(30, Math.sqrt(cluster.totalCount) * 8))
        .attr('fill', color)
        .attr('fill-opacity', 0.04)
        .style('cursor', 'pointer')
        .on('click', () => onClusterClick?.(cluster.id))

      // Label
      zoomGroup.append('text')
        .attr('x', center.x)
        .attr('y', center.y - Math.max(30, Math.sqrt(cluster.totalCount) * 8) - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', color)
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('opacity', 0.9)
        .text(`${categoryLabels[cluster.id] || cluster.id} (${cluster.totalCount})`)
    })

    // Tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      nodeElements
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!)
    })

    // Cool down faster for large datasets
    simulation.alpha(0.8).alphaDecay(0.02)

    return () => { simulation.stop() }
  }, [clusters, nodes, links, onClusterClick])

  useEffect(() => {
    const cleanup = render()
    const handleResize = () => render()
    window.addEventListener('resize', handleResize)
    return () => {
      cleanup?.()
      window.removeEventListener('resize', handleResize)
    }
  }, [render])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0f]">
      <svg ref={svgRef} className="w-full h-full" />
      <div
        ref={tooltipRef}
        className="fixed z-50 hidden max-w-xs px-3 py-2 rounded-lg bg-black/90 text-white text-sm border border-white/10 pointer-events-none"
      />
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-lg">
          No flags to visualize
        </div>
      )}
    </div>
  )
}
