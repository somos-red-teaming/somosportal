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

  // Batch fetch relations
  const userIds = [...new Set((flags || []).map(f => f.user_id).filter(Boolean))]
  const interactionIds = [...new Set((flags || []).map(f => f.interaction_id).filter(Boolean))]

  const { data: users } = userIds.length > 0
    ? await supabase.from('users').select('id, email, full_name').in('id', userIds)
    : { data: [] }
  const userMap = new Map(users?.map(u => [u.id, { email: u.email, full_name: u.full_name }]) || [])

  const { data: interactions } = interactionIds.length > 0
    ? await supabase.from('interactions').select('id, prompt, response, model_id, exercise_id').in('id', interactionIds)
    : { data: [] }
  const interactionMap = new Map(interactions?.map(i => [i.id, i]) || [])

  const flagsWithRelations = (flags || []).map(flag => {
    const user = userMap.get(flag.user_id) || null
    let interaction = null
    let model = null

    if (flag.interaction_id) {
      const int = interactionMap.get(flag.interaction_id)
      if (int) {
        model = modelMap.get(int.model_id) || null
        const exercise = exerciseMap.get(int.exercise_id) || null
        interaction = { prompt: int.prompt, response: int.response, model, exercise }
      }
    }

    if (!model && flag.evidence?.modelId) {
      model = modelMap.get(flag.evidence.modelId) || null
    }

    return { ...flag, user, interaction, model }
  })

  // Filter by exercise if specified
  let filteredFlags = flagsWithRelations
  if (exerciseId) {
    filteredFlags = flagsWithRelations.filter(f => f.interaction?.exercise?.id === exerciseId)
  }

  return NextResponse.json({ flags: filteredFlags, total: exerciseId ? filteredFlags.length : count })
}
