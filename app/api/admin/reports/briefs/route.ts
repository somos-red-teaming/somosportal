import { createClient } from '@supabase/supabase-js'
import { NextResponse, NextRequest } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const exerciseId = request.nextUrl.searchParams.get('exercise_id')
  const supabase = getSupabase()
  const query = supabase.from('governance_briefs').select('*').order('updated_at', { ascending: false }).limit(1)
  if (exerciseId) query.eq('exercise_id', exerciseId)
  else query.is('exercise_id', null)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] || null)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const supabase = getSupabase()
  if (body.id) {
    const { error } = await supabase.from('governance_briefs').update({ content: body.content, title: body.title, ai_model: body.ai_model }).eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: body.id })
  }
  const { data, error } = await supabase.from('governance_briefs').insert({
    exercise_id: body.exercise_id || null,
    title: body.title,
    content: body.content,
    ai_model: body.ai_model || null,
    created_by: body.created_by || null,
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
