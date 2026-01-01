import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const exerciseId = searchParams.get('exercise_id')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch models for lookup
  const { data: models } = await supabase.from('ai_models').select('id, name, display_name')
  const modelMap = new Map(models?.map(m => [m.id, { name: m.name, blind: m.display_name }]) || [])

  // Fetch exercises for lookup
  const { data: exercises } = await supabase.from('exercises').select('id, title')
  const exerciseMap = new Map(exercises?.map(e => [e.id, e.title]) || [])

  // Build query
  let query = supabase.from('interactions').select('*, user:user_id(email)')
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)
  if (exerciseId) query = query.eq('exercise_id', exerciseId)
  
  const { data: interactions } = await query.order('created_at', { ascending: false }).limit(1000)

  // Transform data
  const exportData = (interactions || []).map(i => ({
    id: i.id,
    exercise: exerciseMap.get(i.exercise_id) || '',
    model: modelMap.get(i.model_id)?.name || '',
    model_blind_name: modelMap.get(i.model_id)?.blind || '',
    prompt: i.prompt,
    response: i.response,
    user: i.user?.email || '',
    created_at: i.created_at,
  }))

  if (format === 'csv') {
    const headers = ['ID', 'Exercise', 'Model', 'Blind Name', 'Prompt', 'Response', 'User', 'Created']
    const rows = exportData.map(i => [
      i.id,
      i.exercise,
      i.model,
      i.model_blind_name,
      `"${(i.prompt || '').replace(/"/g, '""')}"`,
      `"${(i.response || '').replace(/"/g, '""')}"`,
      i.user,
      i.created_at,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=interactions-export.csv' }
    })
  }

  return NextResponse.json(exportData)
}
