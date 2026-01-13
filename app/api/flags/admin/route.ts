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

  // Fetch all models upfront for lookup
  const { data: allModels, error: modelsError } = await supabase.from('ai_models').select('id, name, display_name')
  if (modelsError) console.log('Models query error:', modelsError)
  const modelMap = new Map(allModels?.map(m => [m.id, { ...m, blind_name: m.display_name }]) || [])

  // Fetch all exercises upfront
  const { data: allExercises } = await supabase.from('exercises').select('id, title')
  const exerciseMap = new Map(allExercises?.map(e => [e.id, e]) || [])

  // Build flags query
  let query = supabase.from('flags').select('*', { count: 'exact' })
  if (status) query = query.eq('status', status)
  if (category) query = query.eq('category', category)
  if (search) query = query.ilike('description', `%${search}%`)

  const { data: flags, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch relations
  const flagsWithRelations = await Promise.all((flags || []).map(async (flag) => {
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', flag.user_id)
      .single()

    let interaction = null
    let model = null

    if (flag.interaction_id) {
      const { data: int } = await supabase
        .from('interactions')
        .select('prompt, response, model_id, exercise_id')
        .eq('id', flag.interaction_id)
        .single()

      if (int) {
        model = modelMap.get(int.model_id) || null
        const exercise = exerciseMap.get(int.exercise_id) || null
        interaction = { prompt: int.prompt, response: int.response, model, exercise }
      }
    }

    // Fallback: get model from evidence.modelId
    if (!model && flag.evidence?.modelId) {
      model = modelMap.get(flag.evidence.modelId) || null
    }

    return { ...flag, user, interaction, model }
  }))

  // Filter by exercise if specified
  let filteredFlags = flagsWithRelations
  if (exerciseId) {
    filteredFlags = flagsWithRelations.filter(f => f.interaction?.exercise?.id === exerciseId)
  }

  return NextResponse.json({ flags: filteredFlags, total: exerciseId ? filteredFlags.length : count })
}
