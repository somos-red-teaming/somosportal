import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(request: Request) {
  try {
    const { participantId, elapsedSeconds } = await request.json()

    if (!participantId || elapsedSeconds === undefined) {
      console.log('Timer update validation failed:', { participantId, elapsedSeconds })
      return NextResponse.json({ error: 'Participant ID and elapsed seconds required' }, { status: 400 })
    }

    // Get participant record with exercise info
    const { data: participant } = await supabase
      .from('exercise_participation')
      .select('*, exercise:exercises(time_limit_minutes)')
      .eq('id', participantId)
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    // Check if already completed
    if (participant.completed_at) {
      return NextResponse.json({ 
        error: 'Exercise already completed',
        expired: true,
        completed: true
      }, { status: 400 })
    }

    // Calculate new time spent
    const newTimeSpent = participant.time_spent_seconds + elapsedSeconds
    const exercise = Array.isArray(participant.exercise) ? participant.exercise[0] : participant.exercise
    const timeLimit = exercise.time_limit_minutes * 60
    const timeRemaining = timeLimit - newTimeSpent
    const expired = timeRemaining <= 0

    // Update participant record
    const updateData: any = {
      time_spent_seconds: newTimeSpent,
      last_checkpoint: new Date().toISOString()
    }

    // If time expired, mark as completed
    if (expired && !participant.time_expired) {
      updateData.time_expired = true
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('exercise_participation')
      .update(updateData)
      .eq('id', participantId)

    if (error) {
      console.error('Error updating participant:', error)
      return NextResponse.json({ error: 'Failed to update timer' }, { status: 500 })
    }

    return NextResponse.json({
      timeRemaining: Math.max(0, timeRemaining),
      timeSpent: newTimeSpent,
      expired,
      completed: expired
    })

  } catch (error) {
    console.error('Timer update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
