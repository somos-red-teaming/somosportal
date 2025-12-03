'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import { supabase } from '@/lib/supabase'
import { Calendar, TrendingUp, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Exercise {
  id: string
  title: string
  description: string
  category: string
  difficulty_level: string
  status: string
  end_date: string | null
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('exercises')
          .select('id, title, description, category, difficulty_level, status, end_date')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        
        if (dbError) throw dbError
        setExercises(data || [])
      } catch (err) {
        setError('Failed to load exercises. Please try again.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchExercises()
  }, [])

  const categories = ['all', ...new Set(exercises.map(e => e.category).filter(Boolean))]
  const filtered = filter === 'all' ? exercises : exercises.filter(e => e.category === filter)

  const difficultyColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500',
      intermediate: 'bg-yellow-500',
      advanced: 'bg-red-500',
    }
    return colors[level] || 'bg-gray-500'
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">Active Exercises</h1>
          <p className="text-lg text-muted-foreground text-balance max-w-3xl">
            Choose from our current red teaming exercises. Each exercise focuses on a specific domain and includes structured testing guidelines.
          </p>
        </div>

        {categories.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={filter === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(cat)}
                className="capitalize"
              >
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
              <Card key={exercise.id} className="flex flex-col">
                <CardHeader>
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${difficultyColor(exercise.difficulty_level)}`}>
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="default">{exercise.status}</Badge>
                  </div>
                  <CardTitle className="text-xl">{exercise.title}</CardTitle>
                  <CardDescription className="text-base">{exercise.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="mb-4">
                    <Badge variant="outline">{exercise.category}</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    {exercise.end_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Deadline: {new Date(exercise.end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="capitalize">Difficulty: {exercise.difficulty_level}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/exercise/${exercise.id}`}>Start Testing</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
