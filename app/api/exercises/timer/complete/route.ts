import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { participantId, reason, elapsedSeconds } = await request.json()

    if (!participantId || !reason) {
      return NextResponse.json({ error: 'Participant ID and reason required' }, { status: 400 })
    }

    // Get participant record
    const { data: participant } = await supabase
      .from('exercise_participation')
      .select('*')
      .eq('id', participantId)
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    // Check if already completed
    if (participant.completed_at) {
      return NextResponse.json({ 
        success: true,
        message: 'Already completed'
      })
    }

    // Update time spent if provided
    const updateData: any = {
      completed_at: new Date().toISOString()
    }

    if (reason === 'expired') {
      updateData.time_expired = true
      // Set time spent to exactly the time limit when expired
      const { data: exercise } = await supabase
        .from('exercises')
        .select('time_limit_minutes')
        .eq('id', participant.exercise_id)
        .single()
      
      if (exercise?.time_limit_minutes) {
        updateData.time_spent_seconds = exercise.time_limit_minutes * 60
      }
    } else if (elapsedSeconds !== undefined) {
      updateData.time_spent_seconds = participant.time_spent_seconds + elapsedSeconds
    }

    const { error } = await supabase
      .from('exercise_participation')
      .update(updateData)
      .eq('id', participantId)

    if (error) {
      console.error('Error completing exercise:', error)
      return NextResponse.json({ error: 'Failed to complete exercise' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reason
    })

  } catch (error) {
    console.error('Timer complete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
