import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
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

export default async function ExercisePage() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  console.log('ExercisePage - All cookies:', allCookies.map(c => c.name))
  console.log('ExercisePage - Supabase cookies:', allCookies.filter(c => c.name.startsWith('sb-')))
  
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  console.log('ExercisePage - user:', user?.id, 'error:', authError)
  
  if (!user) {
    return <ExerciseClient serverUserId={undefined} initialHistory={{}} />
  }

  // Get user's DB ID
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  console.log('ExercisePage - dbUser:', dbUser?.id)

  if (!dbUser) {
    return <ExerciseClient serverUserId={undefined} initialHistory={{}} />
  }

  // Fetch all interactions for this user (RLS will enforce access)
  const { data: interactions, error } = await supabase
    .from('interactions')
    .select('id, prompt, response, created_at, model_id, exercise_id')
    .eq('user_id', dbUser.id)
    .order('created_at', { ascending: true })

  console.log('ExercisePage - interactions:', interactions?.length, 'error:', error)

  // Group by exercise_id + model_id
  const historyByModel: Record<string, any[]> = {}
  interactions?.forEach(interaction => {
    const key = `${interaction.exercise_id}-${interaction.model_id}`
    if (!historyByModel[key]) historyByModel[key] = []
    historyByModel[key].push(interaction)
  })
  
  console.log('ExercisePage - historyByModel keys:', Object.keys(historyByModel))
  
  return <ExerciseClient serverUserId={user.id} initialHistory={historyByModel} />
}
