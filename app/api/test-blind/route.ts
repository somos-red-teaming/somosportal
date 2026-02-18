import { NextRequest, NextResponse } from 'next/server'
import { assignModelsToExercise, getExerciseModels, previewBlindAssignments } from '@/lib/blind-assignment'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { action, exerciseId, modelIds, blindName } = await request.json()

    switch (action) {
      case 'assign':
        if (!exerciseId || !modelIds || !Array.isArray(modelIds)) {
          return NextResponse.json({ error: 'exerciseId and modelIds array required' }, { status: 400 })
        }
        const assignments = await assignModelsToExercise(exerciseId, modelIds)
        return NextResponse.json({ success: true, assignments })

      case 'get':
        if (!exerciseId) {
          return NextResponse.json({ error: 'exerciseId required' }, { status: 400 })
        }
        const supabase = await createClient()
        const models = await getExerciseModels(supabase, exerciseId)
        return NextResponse.json({ success: true, models })

      case 'preview':
        if (!modelIds || !Array.isArray(modelIds)) {
          return NextResponse.json({ error: 'modelIds array required' }, { status: 400 })
        }
        const preview = previewBlindAssignments(modelIds)
        return NextResponse.json({ success: true, preview })

      default:
        return NextResponse.json({ error: 'Invalid action. Use: assign, get, or preview' }, { status: 400 })
    }
  } catch (error) {
    console.error('Blind assignment test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
