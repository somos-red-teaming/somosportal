'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Header } from '@/components/header'
import { ChatBox } from '@/components/ChatBox'
import { AlertCircle, Info, ArrowLeft, Users, Calendar, CheckCircle, Flag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getExerciseModels } from '@/lib/blind-assignment'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface Exercise {
  id: string
  title: string
  description: string
  guidelines: string
  category: string
  difficulty_level: string
  start_date: string | null
  end_date: string | null
  max_participants: number | null
}

interface AIModel {
  id: string
  blind_name: string
  ai_models: {
    id: string
    name: string
    display_name: string
    provider: string
    model_id: string
    capabilities: string[]
    is_active: boolean
  }
}

interface Participation {
  id: string
  status: string
  progress: { interactions: number; flags_submitted: number }
  started_at: string
}

const flagCategories = [
  { value: 'harmful_content', label: 'Harmful Content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'bias_discrimination', label: 'Bias/Discrimination' },
  { value: 'privacy_violation', label: 'Privacy Violation' },
  { value: 'inappropriate_response', label: 'Inappropriate Response' },
  { value: 'factual_error', label: 'Factual Error' },
  { value: 'off_topic', label: 'Off-Topic Response' },
]

export default function ExerciseClient() {
  const params = useParams()
  const { user } = useAuth()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [models, setModels] = useState<AIModel[]>([])
  const [participation, setParticipation] = useState<Participation | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [flagCategory, setFlagCategory] = useState('')
  const [severity, setSeverity] = useState([5])
  const [flagComment, setFlagComment] = useState('')

  useEffect(() => {
    fetchData()
  }, [params.id, user])

  /**
   * Fetch exercise data and assigned models with blind names
   * Gets models specifically assigned to this exercise, not all available models
   */
  const fetchData = async () => {
    try {
      // Fetch exercise details
      const exerciseRes = await supabase.from('exercises').select('*').eq('id', params.id).single()
      if (exerciseRes.error) throw exerciseRes.error
      setExercise(exerciseRes.data)

      // Fetch models assigned to this exercise with blind names
      const exerciseModels = await getExerciseModels(params.id as string)
      setModels(exerciseModels)

      // Get participant count using RLS-safe function
      const { data: countData } = await supabase
        .rpc('get_exercise_participant_count', { exercise_uuid: params.id })
      setParticipantCount(countData || 0)

      // Check if user is participating
      if (user) {
        const { data: userData } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single()
        if (userData) {
          const { data: part } = await supabase
            .from('exercise_participation')
            .select('*')
            .eq('exercise_id', params.id)
            .eq('user_id', userData.id)
            .single()
          setParticipation(part)
        }
      }
    } catch {
      setError('Exercise not found')
    } finally {
      setLoading(false)
    }
  }

  const isExerciseFull = Boolean(exercise?.max_participants && participantCount >= exercise.max_participants)

  const handleJoin = async () => {
    if (!user) return
    
    // Check if exercise is full
    if (exercise?.max_participants && participantCount >= exercise.max_participants) {
      alert('This exercise is full and cannot accept more participants.')
      return
    }
    
    const { data: userData } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single()
    if (!userData) return

    await supabase.from('exercise_participation').insert({
      exercise_id: params.id,
      user_id: userData.id,
      status: 'active',
    })
    fetchData()
  }

  /**
   * Handle message sent from ChatBox component
   * @param message - Message content sent by user
   */
  const handleMessageSent = (message: string) => {
    // Could be used for analytics or logging
    console.log('Message sent:', message)
  }

  const handleSubmitFlag = () => {
    if (!flagCategory || !flagComment.trim()) return
    alert(`Flag submitted!\nCategory: ${flagCategory}\nSeverity: ${severity[0]}/10`)
    setFlagCategory('')
    setSeverity([5])
    setFlagComment('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Exercise Not Found</h1>
          <Button asChild><Link href="/exercises">Back to Exercises</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/exercises"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">{exercise.title}</h1>
              <p className="text-muted-foreground">{exercise.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge>{exercise.category}</Badge>
                <Badge variant="outline" className="capitalize">{exercise.difficulty_level}</Badge>
                {participation && <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Participating</Badge>}
              </div>
            </div>
            {!participation && user && (
              <Button onClick={handleJoin} disabled={isExerciseFull}>
                {isExerciseFull ? 'Exercise Full' : 'Join Exercise'}
              </Button>
            )}
            {!user && (
              <Button asChild><Link href="/login">Sign in to Join</Link></Button>
            )}
          </div>
          <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
              {exercise.max_participants ? ` / ${exercise.max_participants} max` : ''}
            </span>
            {(exercise.start_date || exercise.end_date) && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {exercise.start_date?.split('T')[0] || 'Now'} - {exercise.end_date?.split('T')[0] || 'Ongoing'}
              </span>
            )}
          </div>
        </div>

        {participation ? (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" />Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{exercise.guidelines}</div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface - Fixed mobile layout with overflow protection */}
            <div className="lg:col-span-6 -mx-2 sm:-mx-0">
              <div className="w-full overflow-hidden">
                {models.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h2 className="text-xl font-semibold mb-2">No AI Models Assigned</h2>
                      <p className="text-muted-foreground">This exercise doesn't have any AI models configured.</p>
                    </CardContent>
                  </Card>
                ) : models.length === 1 ? (
                  /* Single model - contained height */
                  <div className="h-[calc(100vh-200px)] max-h-[600px] min-h-[400px] w-full">
                    <ChatBox
                      modelName={models[0].blind_name}
                      modelId={models[0].ai_models.id}
                      exerciseId={params.id as string}
                      onSendMessage={handleMessageSent}
                    />
                  </div>
                ) : (
                  /* Multiple models - responsive grid for all assigned models */
                  <div className={`space-y-4 lg:space-y-0 lg:grid lg:gap-4 w-full ${
                    models.length === 2 ? 'lg:grid-cols-2' : 
                    models.length === 3 ? 'lg:grid-cols-3' : 
                    'lg:grid-cols-2'
                  }`}>
                    {models.map((model) => (
                      <div key={model.model_id} className="h-[calc(50vh-100px)] lg:h-[calc(100vh-250px)] max-h-[450px] min-h-[300px] w-full">
                        <ChatBox
                          modelName={model.blind_name}
                          modelId={model.ai_models.id}
                          exerciseId={params.id as string}
                          onSendMessage={handleMessageSent}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-3">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Flag className="h-5 w-5" />Flag Issue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Category</Label>
                    <ScrollArea className="h-[180px] rounded-md border p-2 mt-1">
                      {flagCategories.map((cat) => (
                        <div key={cat.value} className={`flex items-center gap-2 p-2 rounded cursor-pointer ${flagCategory === cat.value ? 'bg-primary/10' : 'hover:bg-accent'}`} onClick={() => setFlagCategory(cat.value)}>
                          <Checkbox checked={flagCategory === cat.value} />
                          <span className="text-sm">{cat.label}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  <div>
                    <div className="flex justify-between"><Label>Severity</Label><span className="text-sm">{severity[0]}/10</span></div>
                    <Slider value={severity} onValueChange={setSeverity} min={1} max={10} className="mt-2" />
                  </div>
                  <div>
                    <Label>Comment</Label>
                    <Textarea placeholder="Describe the issue..." value={flagComment} onChange={(e) => setFlagComment(e.target.value)} rows={3} className="mt-1" />
                  </div>
                  <Button onClick={handleSubmitFlag} className="w-full" disabled={!flagCategory || !flagComment}>
                    <Flag className="mr-2 h-4 w-4" />Submit Flag
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Join to Start Testing</h2>
              <p className="text-muted-foreground mb-4">You need to join this exercise to access the testing interface.</p>
              <div className="bg-muted p-4 rounded-lg text-left max-w-xl mx-auto">
                <h3 className="font-medium mb-2">Guidelines Preview:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{exercise.guidelines.slice(0, 300)}{exercise.guidelines.length > 300 ? '...' : ''}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
