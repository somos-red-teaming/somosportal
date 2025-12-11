'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, TrendingUp, FileText, AlertCircle, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Exercise {
  id: string
  title: string
  description: string
  category: string
  difficulty_level: string
  status: string
  start_date: string | null
  end_date: string | null
  max_participants: number | null
  participant_count: number
  is_joined: boolean
}

export default function ExercisesPage() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    fetchExercises()
  }, [user])

  const fetchExercises = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('exercises')
        .select('id, title, description, category, difficulty_level, status, start_date, end_date, max_participants')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (dbError) throw dbError

      let userId: string | null = null
      if (user) {
        const { data: userData } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single()
        userId = userData?.id || null
      }

      const exerciseIds = (data || []).map(e => e.id)
      
      // Get participant counts using RLS-safe function
      const counts: Record<string, number> = {}
      const joined: Record<string, boolean> = {}
      
      // Get counts for each exercise
      for (const exercise of (data || [])) {
        const { data: countData } = await supabase
          .rpc('get_exercise_participant_count', { exercise_uuid: exercise.id })
        counts[exercise.id] = countData || 0
      }

      // Check which exercises the user has joined (if logged in)
      if (userId) {
        const { data: userParticipation } = await supabase
          .from('exercise_participation')
          .select('exercise_id')
          .in('exercise_id', exerciseIds)
          .eq('user_id', userId)
          .eq('status', 'active')
        
        userParticipation?.forEach(p => {
          joined[p.exercise_id] = true
        })
      }

      const enriched = (data || []).map(e => ({
        ...e,
        participant_count: counts[e.id] || 0,
        is_joined: joined[e.id] || false,
      }))

      setExercises(enriched)
    } catch (err) {
      setError('Failed to load exercises.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (exerciseId: string) => {
    if (!user) return
    setJoining(exerciseId)

    const { data: userData } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single()
    if (!userData) { setJoining(null); return }

    const { error } = await supabase.from('exercise_participation').insert({
      exercise_id: exerciseId,
      user_id: userData.id,
      status: 'active',
    })

    if (!error) await fetchExercises()
    setJoining(null)
  }

  const handleLeave = async (exerciseId: string) => {
    if (!user) return
    setJoining(exerciseId)

    const { data: userData } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single()
    if (!userData) { setJoining(null); return }

    await supabase.from('exercise_participation').delete().eq('exercise_id', exerciseId).eq('user_id', userData.id)
    await fetchExercises()
    setJoining(null)
  }

  const categories = ['all', ...new Set(exercises.map(e => e.category).filter(Boolean))]
  const filtered = filter === 'all' ? exercises : exercises.filter(e => e.category === filter)

  const difficultyColor = (level: string) => {
    const colors: Record<string, string> = { beginner: 'bg-green-500', intermediate: 'bg-yellow-500', advanced: 'bg-red-500' }
    return colors[level] || 'bg-gray-500'
  }

  const isExerciseFull = (ex: Exercise) => ex.max_participants && ex.participant_count >= ex.max_participants

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">Active Exercises</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Join red teaming exercises to test AI models and help identify potential issues.
          </p>
        </div>

        {categories.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button key={cat} variant={filter === cat ? 'default' : 'outline'} size="sm" onClick={() => setFilter(cat)} className="capitalize">
                {cat === 'all' ? 'All Exercises' : cat}
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="text-destructive">{error}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No exercises available</h2>
              <p className="text-muted-foreground">Check back soon for new red-teaming exercises.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((exercise) => (
              <Card key={exercise.id} className={`flex flex-col ${exercise.is_joined ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${difficultyColor(exercise.difficulty_level)}`}>
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex gap-2">
                      {exercise.is_joined && <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Joined</Badge>}
                      {isExerciseFull(exercise) && !exercise.is_joined && <Badge variant="secondary">Full</Badge>}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{exercise.title}</CardTitle>
                  <CardDescription className="text-base">{exercise.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="outline">{exercise.category}</Badge>
                    <Badge variant="outline" className="capitalize">{exercise.difficulty_level}</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    {(exercise.start_date || exercise.end_date) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{exercise.start_date?.split('T')[0] || 'Now'} - {exercise.end_date?.split('T')[0] || 'Ongoing'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{exercise.participant_count} participant{exercise.participant_count !== 1 ? 's' : ''}{exercise.max_participants ? ` / ${exercise.max_participants} max` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="capitalize">Difficulty: {exercise.difficulty_level}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  {exercise.is_joined ? (
                    <>
                      <Button asChild className="flex-1"><Link href={`/exercise/${exercise.id}`}>Continue Testing</Link></Button>
                      <Button variant="outline" onClick={() => handleLeave(exercise.id)} disabled={joining === exercise.id}>Leave</Button>
                    </>
                  ) : (
                    <>
                      {user ? (
                        <Button className="flex-1" onClick={() => handleJoin(exercise.id)} disabled={joining === exercise.id || isExerciseFull(exercise)}>
                          {joining === exercise.id ? 'Joining...' : isExerciseFull(exercise) ? 'Exercise Full' : 'Join Exercise'}
                        </Button>
                      ) : (
                        <Button asChild className="flex-1"><Link href="/login">Sign in to Join</Link></Button>
                      )}
                      <Button variant="outline" asChild><Link href={`/exercise/${exercise.id}`}>Preview</Link></Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
