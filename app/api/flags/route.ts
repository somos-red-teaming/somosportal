import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API endpoint for submitting flags
 * Saves flag with full conversation context to database
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      exerciseId, 
      modelId, 
      categories, 
      severity, 
      comment, 
      messages,
      userId // Accept userId from client
    } = await request.json()

    if (!exerciseId || !modelId || !categories?.length || !comment?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // If userId provided, verify it exists
    let finalUserId = userId
    if (userId) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()
      if (!user) finalUserId = null
    }

    // Fallback: get first user (for backwards compatibility)
    if (!finalUserId) {
      const { data: users } = await supabase.from('users').select('id').limit(1)
      finalUserId = users?.[0]?.id
    }

    if (!finalUserId) {
      return NextResponse.json({ error: 'No user found' }, { status: 400 })
    }

    // Create single interaction to link the flag
    const { data: interaction } = await supabase
      .from('interactions')
      .insert({
        exercise_id: exerciseId,
        user_id: finalUserId,
        model_id: modelId,
        session_id: crypto.randomUUID(),
        prompt: messages.find((m: { type: string }) => m.type === 'user')?.content || '',
        response: messages.filter((m: { type: string }) => m.type === 'ai').pop()?.content || null,
      })
      .select()
      .single()

    // Create ONE flag with categories as array in evidence, full conversation stored
    const { data: flag, error: flagError } = await supabase
      .from('flags')
      .insert({
        user_id: finalUserId,
        interaction_id: interaction?.id,
        category: categories[0],
        severity: severity,
        title: `Flag: ${categories.join(', ')}`,
        description: comment,
        evidence: { 
          modelId,
          categories,
          conversation: messages,
          timestamp: new Date().toISOString()
        },
        status: 'pending'
      })
      .select()
      .single()

    if (flagError) {
      console.error('Error saving flag:', flagError)
      return NextResponse.json({ error: 'Failed to save flag' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Flag submitted successfully',
      flagId: flag.id
    })

  } catch (error) {
    console.error('Flag submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit flag. Please try again.' },
      { status: 500 }
    )
  }
}
