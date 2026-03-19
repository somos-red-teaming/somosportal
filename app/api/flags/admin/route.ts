import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const exerciseId = searchParams.get('exercise_id')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Single query with nested joins
  let query = supabase
    .from('flags')
    .select(`
      id, category, severity, title, description, evidence, status,
      reviewer_notes, created_at, reviewed_at,
      user:users!flags_user_id_fkey(email, full_name),
      interaction:interactions(
        prompt, response, model_id, exercise_id,
        model:ai_models(id, name, display_name),
        exercise:exercises(id, title)
      )
    `, { count: 'exact' })

  // Apply filters in SQL
  if (status) query = query.eq('status', status)
  if (category) query = query.eq('category', category)
  if (search) query = query.ilike('description', `%${search}%`)
  if (exerciseId) query = query.eq('interaction.exercise_id', exerciseId)

  const { data: flags, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Small lookup for flags that only have evidence.modelId (no interaction)
  const evidenceModelIds = (flags || [])
    .filter((f: any) => !f.interaction && f.evidence?.modelId)
    .map((f: any) => f.evidence.modelId)
  
  let evidenceModelMap = new Map()
  if (evidenceModelIds.length > 0) {
    const { data: models } = await supabase
      .from('ai_models')
      .select('id, name, display_name')
      .in('id', [...new Set(evidenceModelIds)])
    evidenceModelMap = new Map(models?.map(m => [m.id, m]) || [])
  }

  // Transform to match existing frontend format
  const flagsFormatted = (flags || []).map((flag: any) => {
    let model = null
    if (flag.interaction?.model) {
      model = { ...flag.interaction.model, blind_name: flag.interaction.model.display_name }
    } else if (flag.evidence?.modelId) {
      const m = evidenceModelMap.get(flag.evidence.modelId)
      model = m ? { ...m, blind_name: m.display_name } : null
    }

    return {
      ...flag,
      model,
      interaction: flag.interaction
        ? {
            prompt: flag.interaction.prompt,
            response: flag.interaction.response,
            model: flag.interaction.model,
            exercise: flag.interaction.exercise
          }
        : null
    }
  })

  return NextResponse.json({ flags: flagsFormatted, total: count })
}
