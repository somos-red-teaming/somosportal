import { createClient } from '@supabase/supabase-js'
import ExerciseClient from './ExerciseClient'

export async function generateStaticParams() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Fallback for build time if no exercises exist yet
  const fallback = [{ id: 'placeholder' }]
  
  if (!url || !key) return fallback
  
  try {
    const supabase = createClient(url, key)
    const { data } = await supabase.from('exercises').select('id').limit(100)
    const params = (data || []).map((ex) => ({ id: ex.id }))
    return params.length > 0 ? params : fallback
  } catch {
    return fallback
  }
}

export default function ExercisePage() {
  return <ExerciseClient />
}
