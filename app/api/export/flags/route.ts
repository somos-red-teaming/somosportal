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
  const { data: models } = await supabase.from('ai_models').select('id, name')
  const modelMap = new Map(models?.map(m => [m.id, m.name]) || [])

  // Fetch exercises for lookup
  const { data: exercises } = await supabase.from('exercises').select('id, title')
  const exerciseMap = new Map(exercises?.map(e => [e.id, e.title]) || [])

  // Build query
  let query = supabase.from('flags').select('*, user:user_id(email), interaction:interaction_id(exercise_id, model_id)')
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)
  
  const { data: flags } = await query.order('created_at', { ascending: false })

  // Filter by exercise if specified
  let filtered = flags || []
  if (exerciseId) {
    filtered = filtered.filter(f => f.interaction?.exercise_id === exerciseId)
  }

  // Transform data
  const exportData = filtered.map(f => ({
    id: f.id,
    categories: f.evidence?.categories || [f.category],
    severity: f.severity,
    status: f.status,
    description: f.description,
    exercise: exerciseMap.get(f.interaction?.exercise_id) || '',
    model: modelMap.get(f.interaction?.model_id) || f.evidence?.modelId || '',
    submitted_by: f.user?.email || '',
    created_at: f.created_at,
    reviewed_at: f.reviewed_at,
    reviewer_notes: f.reviewer_notes,
  }))

  if (format === 'csv') {
    const headers = ['ID', 'Categories', 'Severity', 'Status', 'Description', 'Exercise', 'Model', 'Submitted By', 'Created', 'Reviewed', 'Notes']
    const rows = exportData.map(f => [
      f.id,
      f.categories.join('; '),
      f.severity,
      f.status,
      `"${(f.description || '').replace(/"/g, '""')}"`,
      f.exercise,
      f.model,
      f.submitted_by,
      f.created_at,
      f.reviewed_at || '',
      `"${(f.reviewer_notes || '').replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=flags-export.csv' }
    })
  }

  return NextResponse.json(exportData)
}
