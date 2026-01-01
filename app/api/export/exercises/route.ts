import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch exercises
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: false })

  // Get participant counts and flag counts
  const exportData = await Promise.all((exercises || []).map(async (e) => {
    const { count: participants } = await supabase
      .from('exercise_participation')
      .select('id', { count: 'exact', head: true })
      .eq('exercise_id', e.id)

    const { count: flags } = await supabase
      .from('flags')
      .select('id', { count: 'exact', head: true })
      .eq('interaction_id', e.id) // This won't work directly, need join

    // Get flags via interactions
    const { data: interactions } = await supabase
      .from('interactions')
      .select('id')
      .eq('exercise_id', e.id)
    
    const interactionIds = interactions?.map(i => i.id) || []
    let flagCount = 0
    if (interactionIds.length > 0) {
      const { count } = await supabase
        .from('flags')
        .select('id', { count: 'exact', head: true })
        .in('interaction_id', interactionIds)
      flagCount = count || 0
    }

    return {
      id: e.id,
      title: e.title,
      description: e.description,
      category: e.category,
      status: e.status,
      difficulty: e.difficulty,
      participants: participants || 0,
      max_participants: e.max_participants,
      flags: flagCount,
      start_date: e.start_date,
      end_date: e.end_date,
      created_at: e.created_at,
    }
  }))

  if (format === 'csv') {
    const headers = ['ID', 'Title', 'Category', 'Status', 'Difficulty', 'Participants', 'Max', 'Flags', 'Start', 'End', 'Created']
    const rows = exportData.map(e => [
      e.id,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      e.category,
      e.status,
      e.difficulty,
      e.participants,
      e.max_participants || '',
      e.flags,
      e.start_date || '',
      e.end_date || '',
      e.created_at,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=exercises-export.csv' }
    })
  }

  return NextResponse.json(exportData)
}
