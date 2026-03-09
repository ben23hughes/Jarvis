'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import type { Contact, RelationshipType } from '@/types/contacts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

const REL_COLORS: Record<RelationshipType | 'you' | 'unknown', string> = {
  you: '#6366f1',
  colleague: '#3b82f6',
  client: '#10b981',
  friend: '#f59e0b',
  investor: '#8b5cf6',
  mentor: '#ec4899',
  vendor: '#f97316',
  other: '#94a3b8',
  unknown: '#cbd5e1',
}

const REL_LABELS: Record<RelationshipType, string> = {
  colleague: 'Colleague',
  client: 'Client',
  friend: 'Friend',
  investor: 'Investor',
  mentor: 'Mentor',
  vendor: 'Vendor',
  other: 'Other',
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  sublabel?: string
  type: RelationshipType | 'you' | 'unknown'
  contact?: Contact
  radius: number
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  type: 'primary' | 'introduction'
}

interface Props {
  contacts: Contact[]
  userName: string
}

export function RelationshipGraph({ contacts, userName }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSelect = useCallback((c: Contact | null) => setSelected(c), [])

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height: Math.max(height, 500) })
    })
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current || contacts.length === 0) return
    const { width, height } = dimensions
    const cx = width / 2
    const cy = height / 2

    // Build nodes
    const youNode: GraphNode = {
      id: '__you__',
      label: userName,
      type: 'you',
      radius: 28,
      fx: cx,
      fy: cy,
    }

    const contactNodes: GraphNode[] = contacts.map((c) => ({
      id: c.id,
      label: [c.first_name, c.last_name].filter(Boolean).join(' '),
      sublabel: c.company ?? c.title,
      type: c.relationship_type ?? 'unknown',
      contact: c,
      radius: 20,
    }))

    const nodes: GraphNode[] = [youNode, ...contactNodes]

    // Build links
    const links: GraphLink[] = contactNodes.map((n) => ({
      source: '__you__',
      target: n.id,
      type: 'primary' as const,
    }))

    // Introduction links
    for (const c of contacts) {
      if (c.connected_through) {
        links.push({ source: c.connected_through, target: c.id, type: 'introduction' })
      }
    }

    // Clear previous
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Zoom/pan
    const g = svg.append('g')
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (e) => g.attr('transform', e.transform))
    )

    // Simulation
    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(120).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('collision', d3.forceCollide<GraphNode>().radius((d) => d.radius + 12))
      .force('center', d3.forceCenter(cx, cy).strength(0.05))

    // Links
    const linkEl = g.append('g').selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => d.type === 'introduction' ? '#6366f130' : '#e2e8f0')
      .attr('stroke-width', (d) => d.type === 'introduction' ? 1 : 1.5)
      .attr('stroke-dasharray', (d) => d.type === 'introduction' ? '4 3' : null)

    // Node groups
    const nodeEl = g.append('g').selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', (d) => d.id === '__you__' ? 'default' : 'pointer')
      .on('click', (_, d) => {
        if (d.contact) handleSelect(d.contact)
      })
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end', (e, d) => {
            if (!e.active) sim.alphaTarget(0)
            if (d.id !== '__you__') { d.fx = null; d.fy = null }
          }) as unknown as (selection: d3.Selection<SVGGElement | d3.BaseType, GraphNode, SVGGElement, unknown>) => void
      )

    // Circles
    nodeEl.append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => REL_COLORS[d.type])
      .attr('fill-opacity', (d) => d.id === '__you__' ? 1 : 0.85)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    // Name labels
    nodeEl.append('text')
      .text((d) => d.label.length > 12 ? d.label.slice(0, 11) + '…' : d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.radius + 14)
      .attr('font-size', 11)
      .attr('fill', 'currentColor')
      .attr('class', 'fill-foreground')

    // Sub-labels (company)
    nodeEl.filter((d) => !!d.sublabel)
      .append('text')
      .text((d) => (d.sublabel ?? '').length > 14 ? (d.sublabel ?? '').slice(0, 13) + '…' : (d.sublabel ?? ''))
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.radius + 26)
      .attr('font-size', 9)
      .attr('class', 'fill-muted-foreground')

    // Initials inside circles
    nodeEl.append('text')
      .text((d) => {
        const parts = d.label.split(' ')
        return parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : d.label.slice(0, 2).toUpperCase()
      })
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', (d) => d.id === '__you__' ? 13 : 11)
      .attr('font-weight', '600')
      .attr('fill', 'white')
      .attr('pointer-events', 'none')

    // Tick
    sim.on('tick', () => {
      linkEl
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0)
      nodeEl.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    return () => { sim.stop() }
  }, [contacts, userName, dimensions, handleSelect])

  const connectedThrough = selected?.connected_through
    ? contacts.find((c) => c.id === selected.connected_through)
    : null

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(REL_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: REL_COLORS[type as RelationshipType] }} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: REL_COLORS.unknown }} />
          Untagged
        </div>
      </div>

      <div className="relative">
        <div ref={containerRef} className="rounded-lg border bg-card overflow-hidden" style={{ height: 560 }}>
          <svg ref={svgRef} width="100%" height="100%" />
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="absolute top-3 right-3 w-64">
            <Card className="shadow-lg">
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{selected.first_name} {selected.last_name}</p>
                    {selected.title && <p className="text-xs text-muted-foreground">{selected.title}</p>}
                    {selected.company && <p className="text-xs text-muted-foreground">{selected.company}</p>}
                  </div>
                  <button onClick={() => handleSelect(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {selected.relationship_type && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {REL_LABELS[selected.relationship_type]}
                  </Badge>
                )}

                {connectedThrough && (
                  <p className="text-xs text-muted-foreground">
                    Met through <span className="font-medium text-foreground">{connectedThrough.first_name} {connectedThrough.last_name}</span>
                  </p>
                )}

                {selected.relationship_notes && (
                  <p className="text-xs text-muted-foreground border-t pt-2">{selected.relationship_notes}</p>
                )}

                <div className="space-y-0.5 text-xs text-muted-foreground pt-1">
                  {selected.email && <p>{selected.email}</p>}
                  {selected.phone && <p>{selected.phone}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Drag nodes to rearrange · Scroll to zoom · Click a person to see details
      </p>
    </div>
  )
}
