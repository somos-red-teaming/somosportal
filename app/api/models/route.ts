import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/models
 * Fetches all active AI models from the database
 * @returns JSON response with models array
 */
export async function GET() {
  try {
    const { data: models, error } = await supabase
      .from('ai_models')
      .select('id, name, provider')
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw error
    }

    return NextResponse.json({ models: models || [] })
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json({ models: [] }, { status: 500 })
  }
}
