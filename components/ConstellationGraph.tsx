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

const STARFIELD_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'>
  <rect width='160' height='160' fill='black' opacity='0'/>
  <circle cx='20' cy='40' r='1.2' fill='white' opacity='0.35'/>
  <circle cx='120' cy='20' r='0.8' fill='white' opacity='0.25'/>
  <circle cx='90' cy='140' r='1' fill='white' opacity='0.3'/>
  <circle cx='140' cy='90' r='0.8' fill='white' opacity='0.2'/>
  <circle cx='40' cy='110' r='0.9' fill='white' opacity='0.28'/>
  <circle cx='70' cy='70' r='0.6' fill='white' opacity='0.2'/>
</svg>
`

const STARFIELD_TEXTURE = `url("data:image/svg+xml,${encodeURIComponent(STARFIELD_SVG)}")`

export default function ConstellationGraph({ clusters, nodes, links, onClusterClick }: ConstellationGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const render = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    if (nodes.length === 0) {
      return () => {}
    }

    const tooltipEl = tooltipRef.current
    if (!tooltipEl) return
    const tooltip = d3.select<HTMLDivElement, unknown>(tooltipEl)

    // Read theme colors from CSS variables
    const styles = getComputedStyle(container)
    const borderColor = styles.getPropertyValue('--border').trim() || '#D6D3CF'

    // Color scale by category
    const colorScale = new Map(clusters.map((c, i) => [c.id, CLUSTER_COLORS[i % CLUSTER_COLORS.length]]))

    // Shared filters for glow/shadow
    const defs = svg.append('defs')
    const glowFilter = defs.append('filter')
      .attr('id', 'node-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')
    glowFilter.append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', 6)
      .attr('result', 'coloredBlur')
    const glowMerge = glowFilter.append('feMerge')
    glowMerge.append('feMergeNode').attr('in', 'coloredBlur')
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    const labelShadow = defs.append('filter')
      .attr('id', 'label-shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')
    labelShadow.append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 3)
      .attr('stdDeviation', 6)
      .attr('flood-color', '#000000')
      .attr('flood-opacity', 0.55)

    // Build simulation nodes with category grouping
    type SimNode = NodeData & d3.SimulationNodeDatum & { radius: number; color: string }
    type SimLink = d3.SimulationLinkDatum<SimNode>

    const severityScale = d3.scaleLinear().domain([1, 10]).range([4, 28])

    const simNodes: SimNode[] = nodes.map(n => {
      const severity = Math.max(1, Math.min(10, n.severity || 1))
      return {
        ...n,
        radius: severityScale(severity),
        color: colorScale.get(n.category) || '#666',
      }
    })

    const nodeMap = new Map(simNodes.map(n => [n.id, n]))
    const simLinks: SimLink[] = links
      .filter(l => nodeMap.has(l.source) && nodeMap.has(l.target))
      .map(l => ({ source: l.source, target: l.target }))

    // Cluster centers for force grouping
    type ClusterCenter = { x: number; y: number; angle: number; orbitRadius: number }
    const clusterCenters = new Map<string, ClusterCenter>()
    const orbitRing = Math.min(width, height) * 0.24
    clusters.forEach((c, i) => {
      const angle = (i / Math.max(1, clusters.length)) * 2 * Math.PI
      const r = orbitRing
      clusterCenters.set(c.id, {
        x: width / 2 + Math.cos(angle) * r,
        y: height / 2 + Math.sin(angle) * r,
        angle,
        orbitRadius: r,
      })
    })

    // Force simulation - tuned for large datasets
    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(20).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-15).distanceMax(150))
      .force('collision', d3.forceCollide<SimNode>().radius(d => d.radius + 1))
      .force('cluster', (alpha: number) => {
        for (const node of simNodes) {
          const center = clusterCenters.get(node.category)
          if (!center || node.x === undefined || node.y === undefined) continue
          const dx = center.x - node.x
          const dy = center.y - node.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          const basePull = alpha * 0.35
          node.vx = (node.vx || 0) + dx * basePull
          node.vy = (node.vy || 0) + dy * basePull

          const maxDistance = center.orbitRadius * 0.75
          if (distance > maxDistance) {
            const clampPull = ((distance - maxDistance) / distance) * alpha * 0.45
            node.vx += dx * clampPull
            node.vy += dy * clampPull
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
      .attr('stroke', borderColor)
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 0.5)

    // Nodes
    const nodeWrapper = zoomGroup.append('g')
    const nodeElements = nodeWrapper
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .attr('opacity', 1)

    nodeElements
      .filter(d => d.severity >= 10)
      .append('circle')
      .attr('r', d => d.radius * 0.6)
      .attr('fill', '#ff1f5a')
      .attr('fill-opacity', 0.7)
      .attr('stroke', '#ffb4c7')
      .attr('stroke-width', 1)
      .attr('filter', 'url(#node-glow)')
      .each(function (d) {
        const circle = d3.select(this)
        const base = d.radius * 0.6
        circle.append('animate')
          .attr('attributeName', 'r')
          .attr('values', `${base}; ${base * 2.4}; ${base}`)
          .attr('dur', '1.6s')
          .attr('repeatCount', 'indefinite')
        circle.append('animate')
          .attr('attributeName', 'fill-opacity')
          .attr('values', '0.7; 0.15; 0.7')
          .attr('dur', '1.6s')
          .attr('repeatCount', 'indefinite')
        circle.append('animate')
          .attr('attributeName', 'stroke-opacity')
          .attr('values', '0.8; 0; 0.8')
          .attr('dur', '1.6s')
          .attr('repeatCount', 'indefinite')
      })

    const mainCircles = nodeElements
      .append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.8)
      .attr('stroke', d => d.color)
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1)
      .attr('filter', d => d.severity >= 8 ? 'url(#node-glow)' : null)

    nodeElements.call(d3.drag<SVGGElement, SimNode>()
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
    const clampPosition = (event: MouseEvent, tooltipElement: HTMLDivElement) => {
      const padding = 8
      const tooltipWidth = tooltipElement.offsetWidth || 200
      const tooltipHeight = tooltipElement.offsetHeight || 120

      let x = event.pageX + padding
      let y = event.pageY - padding

      if (x + tooltipWidth + padding > window.innerWidth) {
        x = event.pageX - tooltipWidth - padding
      }
      if (x < padding) {
        x = padding
      }

      const viewportBottom = window.scrollY + window.innerHeight
      if (y + tooltipHeight > viewportBottom - padding) {
        y = viewportBottom - tooltipHeight - padding
      }
      if (y < window.scrollY + padding) {
        y = window.scrollY + padding
      }

      return { x, y }
    }

    mainCircles
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .transition().duration(150)
          .attr('r', d.radius * 1.8)
          .attr('fill-opacity', 1)

        const position = clampPosition(event, tooltipEl)

        tooltip
          .style('display', 'block')
          .style('left', `${position.x}px`)
          .style('top', `${position.y}px`)
          .html(`
            <div class="font-medium">${categoryLabels[d.category] || d.category}</div>
            <div class="text-xs opacity-70 mt-1">Severity: ${d.severity}/10 · ${d.modelName}</div>
            <div class="text-xs opacity-70">${d.exerciseTitle}</div>
            ${d.promptPreview ? `<div class="text-xs mt-1 opacity-50">"${d.promptPreview}..."</div>` : ''}
          `)
      })
      .on('mousemove', (event) => {
        const position = clampPosition(event, tooltipEl)
        tooltip
          .style('left', `${position.x}px`)
          .style('top', `${position.y}px`)
      })
      .on('mouseout', (event, d) => {
        d3.select(event.currentTarget)
          .transition().duration(150)
          .attr('r', d.radius)
          .attr('fill-opacity', 0.8)
        tooltip.style('display', 'none')
      })

    // Cluster glows + labels
    const clusterLayer = zoomGroup.append('g')
    clusters.forEach((cluster, i) => {
      const center = clusterCenters.get(cluster.id)
      if (!center) return
      const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length]
      const glowRadius = Math.max(30, Math.sqrt(cluster.totalCount) * 8)

      clusterLayer.append('circle')
        .attr('cx', center.x)
        .attr('cy', center.y)
        .attr('r', glowRadius)
        .attr('fill', color)
        .attr('fill-opacity', 0.05)
        .style('cursor', 'pointer')
        .on('click', () => onClusterClick?.(cluster.id))

      const labelDistance = glowRadius + 60
      const rawLabelX = center.x + Math.cos(center.angle) * labelDistance
      const rawLabelY = center.y + Math.sin(center.angle) * labelDistance
      const labelX = Math.min(Math.max(rawLabelX, 80), width - 80)
      const labelY = Math.min(Math.max(rawLabelY, 60), height - 60)
      const midX = (center.x + labelX) / 2 + Math.cos(center.angle + Math.PI / 2) * 20
      const midY = (center.y + labelY) / 2 + Math.sin(center.angle + Math.PI / 2) * 20

      clusterLayer.append('path')
        .attr('d', `M ${center.x} ${center.y} Q ${midX} ${midY} ${labelX} ${labelY}`)
        .attr('stroke', color)
        .attr('stroke-opacity', 0.35)
        .attr('stroke-width', 1.5)
        .attr('fill', 'none')

      const labelGroup = clusterLayer.append('g')
        .attr('transform', `translate(${labelX}, ${labelY})`)
        .style('cursor', 'pointer')
        .attr('filter', 'url(#label-shadow)')
        .on('click', () => onClusterClick?.(cluster.id))

      const labelText = labelGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#f5f5f5')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text(`${categoryLabels[cluster.id] || cluster.id} (${cluster.totalCount})`)

      const textNode = labelText.node()
      if (textNode) {
        const bbox = textNode.getBBox()
        const paddingX = 18
        const paddingY = 8
        labelGroup.insert('rect', 'text')
          .attr('x', bbox.x - paddingX)
          .attr('y', bbox.y - paddingY)
          .attr('width', bbox.width + paddingX * 2)
          .attr('height', bbox.height + paddingY * 2)
          .attr('rx', 999)
          .attr('fill', 'rgba(8, 8, 16, 0.85)')
          .attr('stroke', color)
          .attr('stroke-opacity', 0.7)
      }
    })

    // Tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      nodeElements.attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`)
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

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(() => render())
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [render])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#050509] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(243,213,157,0.18), transparent 55%), radial-gradient(circle at 80% 0%, rgba(232,184,212,0.12), transparent 50%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
        style={{ backgroundImage: STARFIELD_TEXTURE }}
      />
      <svg ref={svgRef} className="relative w-full h-full" />
      <div
        ref={tooltipRef}
        className="fixed z-50 hidden max-w-xs px-3 py-2 rounded-lg bg-black/90 text-white text-sm border border-white/10 pointer-events-none shadow-lg"
      />
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-lg">
          No flags to visualize
        </div>
      )}
    </div>
  )
}
