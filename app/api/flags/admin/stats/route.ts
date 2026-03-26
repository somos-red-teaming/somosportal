import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const categoryLabels: Record<string, string> = {
  harmful_content: 'Harmful Content',
  misinformation: 'Misinformation',
  bias_discrimination: 'Bias/Discrimination',
  privacy_violation: 'Privacy Violation',
  inappropriate_response: 'Inappropriate',
  factual_error: 'Factual Error',
  off_topic: 'Off Topic',
  spam: 'Spam',
  other: 'Other',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const exerciseId = searchParams.get('exercise_id')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Call SQL function for efficient aggregation
  const { data, error } = await supabase.rpc('get_flag_statistics', {
    p_exercise_id: exerciseId || null
  })

  if (error || !data) {
    console.error('Error fetching flag statistics:', error)
    return NextResponse.json({ 
      total: 0, 
      pending: 0, 
      under_review: 0, 
      resolved: 0, 
      dismissed: 0,
      bySeverity: { high: 0, medium: 0, low: 0 },
      byCategory: [],
      byModel: [],
      byUser: []
    })
  }

  // Apply category labels to the data returned from SQL
  const byCategory = (data.byCategory || []).map((cat: any) => ({
    name: categoryLabels[cat.name] || cat.name,
    count: cat.count
  }))

  return NextResponse.json({
    ...data,
    byCategory
  })
}
