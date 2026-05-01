import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/requireAdmin'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin.authorized) {
    return admin.response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const exerciseId = request.nextUrl.searchParams.get('exercise_id')
  const supabase = getSupabaseAdmin()

  // Fetch flags — server-side filter by exercise when possible
  let query = supabase
    .from('flags')
    .select(`
      id, category, severity, status, description, evidence,
      user:users!flags_user_id_fkey(full_name, email),
      interaction:interactions(
        prompt, response, exercise_id, model_id,
        model:ai_models(name, display_name, model_id),
        exercise:exercises(title)
      )
    `)
    .order('severity', { ascending: false })
    .limit(1000)

  const { data: flags, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter by exercise client-side (Supabase can't filter nested relations directly)
  const filtered = exerciseId
    ? (flags || []).filter((f: any) => f.interaction?.exercise_id === exerciseId)
    : (flags || [])

  // 1. Severity contrasts by category
  const categoryStats: Record<string, { min: number; max: number; sum: number; count: number; severities: number[] }> = {}
  // 2. Per-model stats
  const modelStats: Record<string, { flags: number; severitySum: number; categories: Record<string, number>; realName: string }> = {}
  // 3. Other descriptions
  const otherDescriptions: string[] = []
  // 4. Language keywords
  const languageKeywords = ['language', 'translation', 'arabic', 'ukrainian', 'english', 'french', 'spanish', 'bengali', 'yoruba', 'amharic', 'tigrinya', 'swahili', 'hindi', 'urdu']
  const languageFlags: Array<{ description: string; category: string; severity: number }> = []
  // 5. Top prompts
  const promptMap: Record<string, { prompt: string; severity: number; count: number; category: string; model: string }> = {}

  for (const flag of filtered) {
    const categories: string[] = flag.evidence?.categories?.length
      ? flag.evidence.categories
      : [flag.category || 'other']
    const severity = flag.severity || 0
    const modelName = (flag.interaction as any)?.model?.display_name || (flag.interaction as any)?.model?.name || 'Unknown'
    const realModelName = (flag.interaction as any)?.model?.model_id || (flag.interaction as any)?.model?.name || ''
    const prompt = (flag.interaction as any)?.prompt || ''
    const desc = flag.description || flag.evidence?.description || ''

    for (const cat of categories) {
      // Category stats
      if (!categoryStats[cat]) categoryStats[cat] = { min: 10, max: 0, sum: 0, count: 0, severities: [] }
      const cs = categoryStats[cat]
      cs.min = Math.min(cs.min, severity)
      cs.max = Math.max(cs.max, severity)
      cs.sum += severity
      cs.count++
      cs.severities.push(severity)

      // Model stats
      if (!modelStats[modelName]) modelStats[modelName] = { flags: 0, severitySum: 0, categories: {}, realName: realModelName }
      modelStats[modelName].flags++
      modelStats[modelName].severitySum += severity
      modelStats[modelName].categories[cat] = (modelStats[modelName].categories[cat] || 0) + 1
    }

    // Other category
    if (categories.includes('other') && desc) otherDescriptions.push(desc)

    // Language flags
    if (desc && languageKeywords.some(kw => desc.toLowerCase().includes(kw))) {
      languageFlags.push({ description: desc, category: categories[0], severity })
    }

    // Top prompts
    if (prompt) {
      const key = prompt.slice(0, 100)
      if (!promptMap[key]) promptMap[key] = { prompt, severity, count: 0, category: categories[0], model: modelName }
      promptMap[key].count++
      promptMap[key].severity = Math.max(promptMap[key].severity, severity)
    }
  }

  // Build severity contrasts
  const severityContrasts = Object.entries(categoryStats).map(([cat, s]) => ({
    category: cat,
    min: s.min,
    max: s.max,
    avg: s.count > 0 ? Math.round((s.sum / s.count) * 10) / 10 : 0,
    spread: Math.round((s.max - s.min) * 10) / 10,
    count: s.count,
  })).sort((a, b) => b.spread - a.spread)

  // Build model comparison
  const modelComparison = Object.entries(modelStats).map(([name, s]) => {
    const topCat = Object.entries(s.categories).sort(([, a], [, b]) => b - a)[0]
    return {
      name,
      realName: s.realName,
      totalFlags: s.flags,
      avgSeverity: s.flags > 0 ? Math.round((s.severitySum / s.flags) * 10) / 10 : 0,
      topCategory: topCat ? topCat[0] : 'N/A',
      categories: s.categories,
    }
  })

  // Build subtotals per category per model
  const subtotals = Object.entries(categoryStats).map(([cat, s]) => {
    const perModel: Record<string, number> = {}
    for (const [name, ms] of Object.entries(modelStats)) {
      perModel[name] = ms.categories[cat] || 0
    }
    return {
      category: cat,
      totalFlags: s.count,
      avgSeverity: s.count > 0 ? Math.round((s.sum / s.count) * 10) / 10 : 0,
      perModel,
    }
  }).sort((a, b) => b.totalFlags - a.totalFlags)

  // Group other descriptions
  const otherGroups: Record<string, number> = {}
  for (const desc of otherDescriptions) {
    const key = desc.slice(0, 80)
    otherGroups[key] = (otherGroups[key] || 0) + 1
  }
  const otherAnalysis = Object.entries(otherGroups)
    .map(([desc, count]) => ({ description: desc, count }))
    .sort((a, b) => b.count - a.count)

  // Top flagged prompts
  const topPrompts = Object.values(promptMap)
    .sort((a, b) => b.severity - a.severity || b.count - a.count)
    .slice(0, 10)

  return NextResponse.json({
    totalFlags: filtered.length,
    severityContrasts,
    modelComparison,
    subtotals,
    otherAnalysis,
    languageFlags: languageFlags.slice(0, 20),
    topPrompts,
    modelNames: Object.keys(modelStats),
  })
}
