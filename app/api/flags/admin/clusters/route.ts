import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/**
 * Returns clustered flag data for the constellation visualization.
 * Aggregates flags into category clusters server-side to handle thousands of flags
 * without sending raw data to the client.
 * 
 * Query params:
 *   exercise_id - optional, filter by exercise
 *   limit - max individual flag nodes per cluster (default 50, prevents browser overload)
 */
export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin.authorized) {
    return admin.response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const exerciseId = searchParams.get('exercise_id')
  const nodeLimit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get cluster summaries (aggregated by category)
  // First get interaction IDs for the exercise filter if needed
  let interactionIds: string[] | null = null
  if (exerciseId) {
    const { data: interactions } = await supabase
      .from('interactions')
      .select('id')
      .eq('exercise_id', exerciseId)
    interactionIds = interactions?.map(i => i.id) || []
    if (interactionIds.length === 0) {
      return NextResponse.json({ clusters: [], nodes: [], links: [] })
    }
  }

  let clusterQuery = supabase
    .from('flags')
    .select(`
      id,
      category,
      severity,
      status,
      evidence,
      interaction:interactions(
        exercise_id,
        model_id,
        prompt,
        response,
        exercise:exercises(title),
        model:ai_models(name, display_name)
      )
    `)
    .order('severity', { ascending: false })

  if (interactionIds) {
    clusterQuery = clusterQuery.in('interaction_id', interactionIds)
  }

  const { data: flags, error } = await clusterQuery

  if (error) {
    console.error('Error fetching cluster data:', error)
    return NextResponse.json({ clusters: [], nodes: [], links: [] })
  }

  // Build clusters by category, capping nodes per cluster
  const categoryMap = new Map<string, {
    flags: typeof flags
    totalCount: number
    avgSeverity: number
    severitySum: number
  }>()

  for (const flag of flags || []) {
    // Expand categories array from evidence, fallback to flag.category
    const categories: string[] = flag.evidence?.categories?.length
      ? flag.evidence.categories
      : [flag.category || 'other']

    for (const cat of categories) {
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { flags: [], totalCount: 0, avgSeverity: 0, severitySum: 0 })
      }
      const cluster = categoryMap.get(cat)!
      cluster.totalCount++
      cluster.severitySum += flag.severity || 0
      // Only keep top N flags per cluster (highest severity first, already sorted)
      if (cluster.flags.length < nodeLimit) {
        cluster.flags.push(flag)
      }
    }
  }

  const clusters = Array.from(categoryMap.entries()).map(([category, data]) => ({
    id: category,
    name: category,
    totalCount: data.totalCount,
    avgSeverity: data.totalCount > 0 ? Math.round((data.severitySum / data.totalCount) * 10) / 10 : 0,
    nodeCount: data.flags.length,
  }))

  // Build nodes (individual flags, capped per cluster)
  const nodes = Array.from(categoryMap.entries()).flatMap(([category, data]) =>
    data.flags.map(flag => ({
      id: flag.id,
      category,
      severity: flag.severity || 1,
      status: flag.status,
      modelName: (flag.interaction as any)?.model?.name || 'Unknown',
      exerciseTitle: (flag.interaction as any)?.exercise?.title || 'Unknown',
      promptPreview: ((flag.interaction as any)?.prompt || '').slice(0, 100),
      responsePreview: ((flag.interaction as any)?.response || '').slice(0, 100),
    }))
  )

  // Build links between flags in the same cluster
  const links: { source: string; target: string }[] = []
  for (const [, data] of categoryMap) {
    const clusterFlags = data.flags
    // Connect each node to 1-2 neighbors to form a web, not fully connected (O(n) not O(n²))
    for (let i = 1; i < clusterFlags.length; i++) {
      links.push({ source: clusterFlags[i - 1].id, target: clusterFlags[i].id })
      // Cross-link every 3rd node for web effect
      if (i >= 3 && i % 3 === 0) {
        links.push({ source: clusterFlags[i].id, target: clusterFlags[i - 3].id })
      }
    }
  }

  return NextResponse.json({ clusters, nodes, links })
}
