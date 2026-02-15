import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { exerciseId, userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (!exerciseId) {
      return NextResponse.json({ error: 'Exercise ID required' }, { status: 400 })
    }

    // Get user's internal ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get exercise with timer settings
    const { data: exercise } = await supabase
      .from('exercises')
      .select('id, timer_enabled, time_limit_minutes')
      .eq('id', exerciseId)
      .single()

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    if (!exercise.timer_enabled) {
      return NextResponse.json({ error: 'Timer not enabled for this exercise' }, { status: 400 })
    }

    // Check if participant record already exists
    const { data: existing } = await supabase
      .from('exercise_participation')
      .select('*')
      .eq('exercise_id', exerciseId)
      .eq('user_id', userData.id)
      .single()

    if (existing) {
      // Already started - check if timer data needs initialization
      if (existing.last_checkpoint === null) {
        // Initialize timer data for existing participation
        await supabase
          .from('exercise_participation')
          .update({
            time_spent_seconds: 0,
            last_checkpoint: new Date().toISOString(),
            time_expired: false
          })
          .eq('id', existing.id)
        
        return NextResponse.json({
          participantId: existing.id,
          timeRemaining: exercise.time_limit_minutes! * 60,
          timeSpent: 0,
          expired: false,
          completed: false
        })
      }
      
      // Return current state
      const timeRemaining = (exercise.time_limit_minutes! * 60) - (existing.time_spent_seconds || 0)
      return NextResponse.json({
        participantId: existing.id,
        timeRemaining: Math.max(0, timeRemaining),
        timeSpent: existing.time_spent_seconds || 0,
        expired: existing.time_expired || timeRemaining <= 0,
        completed: !!existing.completed_at
      })
    }

    // Create new participant record
    const { data: participant, error } = await supabase
      .from('exercise_participation')
      .insert({
        exercise_id: exerciseId,
        user_id: userData.id,
        time_spent_seconds: 0,
        last_checkpoint: new Date().toISOString(),
        time_expired: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating participant:', error)
      return NextResponse.json({ error: 'Failed to start timer' }, { status: 500 })
    }

    return NextResponse.json({
      participantId: participant.id,
      timeRemaining: exercise.time_limit_minutes! * 60,
      timeSpent: 0,
      expired: false,
      completed: false
    })

  } catch (error) {
    console.error('Timer start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get timer status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const exerciseId = searchParams.get('exerciseId')
    const userId = searchParams.get('userId')

    if (!exerciseId || !userId) {
      return NextResponse.json({ error: 'Exercise ID and User ID required' }, { status: 400 })
    }

    // Get user's internal ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get exercise with timer settings
    const { data: exercise } = await supabase
      .from('exercises')
      .select('id, timer_enabled, time_limit_minutes')
      .eq('id', exerciseId)
      .single()

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    if (!exercise.timer_enabled) {
      return NextResponse.json({ 
        active: false,
        timerEnabled: false
      })
    }

    // Get participant record
    const { data: participant } = await supabase
      .from('exercise_participation')
      .select('*')
      .eq('exercise_id', exerciseId)
      .eq('user_id', userData.id)
      .single()

    if (!participant) {
      return NextResponse.json({
        active: false,
        timerEnabled: true,
        timeLimit: exercise.time_limit_minutes! * 60
      })
    }

    const timeRemaining = (exercise.time_limit_minutes! * 60) - participant.time_spent_seconds

    return NextResponse.json({
      active: true,
      timerEnabled: true,
      participantId: participant.id,
      timeRemaining: Math.max(0, timeRemaining),
      timeSpent: participant.time_spent_seconds,
      expired: participant.time_expired || timeRemaining <= 0,
      completed: !!participant.completed_at,
      lastCheckpoint: participant.last_checkpoint
    })

  } catch (error) {
    console.error('Timer status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
