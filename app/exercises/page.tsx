'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, FileText, AlertCircle, Users, CheckCircle, Shield, Brain, Eye, Lock, AlertTriangle, Zap, Target, Search, MessageSquare, Bot, Sparkles } from 'lucide-react'
import Link from 'next/link'

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

const iconMap: Record<string, React.ComponentType<{className?: string}>> = {
  FileText, Shield, Brain, Eye, Lock, AlertTriangle, Zap, Target, Search, MessageSquare, Bot, Sparkles
}

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
  yellow: 'bg-yellow-500',
}

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
  visibility: string | null
  team_names: string[]
  icon: string | null
  color: string | null
}

export default function ExercisesPage() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [joining, setJoining] = useState<string | null>(null)

  const [visibilityTab, setVisibilityTab] = useState<'public' | 'team' | 'invites'>('public')

  useEffect(() => {
    fetchExercises()
  }, [user])

  const fetchExercises = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('exercises')
        .select('id, title, description, category, difficulty_level, status, start_date, end_date, max_participants, visibility, icon, color')
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

      // Get team names for team-only exercises
      const teamNames: Record<string, string[]> = {}
      const teamExerciseIds = (data || []).filter(e => e.visibility === 'team_only').map(e => e.id)
      if (teamExerciseIds.length > 0) {
        const { data: exerciseTeams } = await supabase
          .from('exercise_teams')
          .select('exercise_id, team:teams(name)')
          .in('exercise_id', teamExerciseIds)
        exerciseTeams?.forEach(et => {
          if (!teamNames[et.exercise_id]) teamNames[et.exercise_id] = []
          const team = Array.isArray(et.team) ? et.team[0] : et.team
          if (team?.name) teamNames[et.exercise_id].push(team.name)
        })
      }

      const enriched = (data || []).map(e => ({
        ...e,
        participant_count: counts[e.id] || 0,
        is_joined: joined[e.id] || false,
        team_names: teamNames[e.id] || [],
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

    if (!error) {
      // Update invite status to accepted if exists
      await supabase.from('exercise_invites')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('exercise_id', exerciseId)
        .eq('user_id', userData.id)
      
      await fetchExercises()
    }
    setJoining(null)
  }

  const handleLeave = async (exerciseId: string) => {
    if (!user) return
    setJoining(exerciseId)

    const { data: userData } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single()
    if (!userData) { setJoining(null); return }

    // Check if exercise has been started or completed
    const { data: participation } = await supabase
      .from('exercise_participation')
      .select('completed_at, time_expired, time_spent_seconds')
      .eq('exercise_id', exerciseId)
      .eq('user_id', userData.id)
      .single()
    
    if (participation?.completed_at || participation?.time_expired) {
      alert('Cannot leave a completed exercise. Your results have been saved.')
      setJoining(null)
      return
    }
    
    if (participation && participation.time_spent_seconds > 0) {
      alert('Cannot leave an exercise that has been started. Please complete it or wait for the timer to expire.')
      setJoining(null)
      return
    }

    await supabase.from('exercise_participation').delete().eq('exercise_id', exerciseId).eq('user_id', userData.id)
    await fetchExercises()
    setJoining(null)
  }

  // Filter by visibility tab first
  const visibilityFiltered = exercises.filter(e => 
    visibilityTab === 'public' 
      ? (e.visibility === 'public' || e.visibility === null)
      : visibilityTab === 'team'
      ? e.visibility === 'team_only'
      : e.visibility === 'invite_only'
  )
  
  const categories = ['all', ...new Set(visibilityFiltered.map(e => e.category).filter(Boolean))]
  const filtered = filter === 'all' ? visibilityFiltered : visibilityFiltered.filter(e => e.category === filter)

  const isExerciseFull = (ex: Exercise) => Boolean(ex.max_participants && ex.participant_count >= ex.max_participants)

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

        {/* Visibility tabs */}
        <div className="mb-6 flex gap-2 border-b pb-4">
          <Button 
            variant={visibilityTab === 'public' ? 'default' : 'ghost'} 
            onClick={() => { setVisibilityTab('public'); setFilter('all') }}
          >
            Public
          </Button>
          <Button 
            variant={visibilityTab === 'team' ? 'default' : 'ghost'} 
            onClick={() => { setVisibilityTab('team'); setFilter('all') }}
          >
            My Teams
          </Button>
          <Button 
            variant={visibilityTab === 'invites' ? 'default' : 'ghost'} 
            onClick={() => { setVisibilityTab('invites'); setFilter('all') }}
          >
            My Invites
          </Button>
        </div>

        {/* Category filter */}
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
              <h2 className="text-xl font-semibold mb-2">
                {visibilityTab === 'team' ? "No team exercises" : visibilityTab === 'invites' ? "No invites" : "No exercises available"}
              </h2>
              <p className="text-muted-foreground">
                {visibilityTab === 'team' 
                  ? "You're not part of any teams yet, or your teams have no assigned exercises."
                  : visibilityTab === 'invites'
                  ? "You haven't been invited to any exercises yet."
                  : "Check back soon for new red-teaming exercises."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((exercise) => {
              const Icon = iconMap[exercise.icon || 'FileText'] || FileText
              const bgColor = colorClasses[exercise.color || 'blue'] || 'bg-blue-500'
              return (
              <Card key={exercise.id} className={`flex flex-col ${exercise.is_joined ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bgColor}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex gap-2">
                      {exercise.is_joined && <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Joined</Badge>}
                      {isExerciseFull(exercise) && !exercise.is_joined && <Badge variant="secondary">Full</Badge>}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{exercise.title}</CardTitle>
                  <CardDescription className="text-base">{stripHtml(exercise.description).slice(0, 150)}{exercise.description.length > 150 ? '...' : ''}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {(exercise.start_date || exercise.end_date) && (
                      <Badge variant="default" className="bg-primary">
                        <Calendar className="h-3 w-3 mr-1" />
                        {exercise.end_date ? `Open until ${exercise.end_date.split('T')[0]}` : exercise.start_date ? `Starts ${exercise.start_date.split('T')[0]}` : 'Open'}
                      </Badge>
                    )}
                    <Badge variant="outline">Category: {exercise.category}</Badge>
                    {exercise.team_names?.map(name => (
                      <Badge key={name} className="bg-green-100 text-green-800 border-green-300">Team: {name}</Badge>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{exercise.participant_count} participant{exercise.participant_count !== 1 ? 's' : ''}{exercise.max_participants ? ` / ${exercise.max_participants} max` : ''}</span>
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
            )})}
          </div>
        )}
      </div>
    </div>
  )
}
