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
import { AlertCircle, Send, Flag, Info, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Exercise {
  id: string
  title: string
  description: string
  guidelines: string
  category: string
  difficulty_level: string
}

interface AIModel {
  id: string
  display_name: string
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
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')
  const [responses, setResponses] = useState<Array<{ model: string; text: string }>>([])
  const [flagCategory, setFlagCategory] = useState('')
  const [severity, setSeverity] = useState([5])
  const [flagComment, setFlagComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exerciseRes, modelsRes] = await Promise.all([
          supabase.from('exercises').select('*').eq('id', params.id).single(),
          supabase.from('ai_models').select('id, display_name').eq('is_active', true),
        ])

        if (exerciseRes.error) throw exerciseRes.error
        setExercise(exerciseRes.data)
        setModels(modelsRes.data || [])
      } catch {
        setError('Exercise not found')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  const handleModelToggle = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter(id => id !== modelId))
    } else if (selectedModels.length < 2) {
      setSelectedModels([...selectedModels, modelId])
    }
  }

  const handleSendPrompt = () => {
    if (!prompt.trim() || selectedModels.length === 0) return
    setIsLoading(true)
    
    setTimeout(() => {
      const newResponses = selectedModels.map(modelId => ({
        model: models.find(m => m.id === modelId)?.display_name || 'Unknown',
        text: `[Demo] Placeholder response for "${prompt}". Real AI integration in Week 5-6.`
      }))
      setResponses(newResponses)
      setIsLoading(false)
    }, 1000)
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
          <h1 className="mb-2 text-3xl font-bold">{exercise.title}</h1>
          <p className="text-muted-foreground">{exercise.description}</p>
          <div className="flex gap-2 mt-2">
            <Badge>{exercise.category}</Badge>
            <Badge variant="outline" className="capitalize">{exercise.difficulty_level}</Badge>
          </div>
        </div>

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

          <div className="lg:col-span-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Model Selection</CardTitle>
                <CardDescription>Select up to 2 models for blind comparison</CardDescription>
              </CardHeader>
              <CardContent>
                {models.length === 0 ? (
                  <p className="text-muted-foreground">No AI models available.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {models.map((model) => (
                      <div
                        key={model.id}
                        className={`flex items-center space-x-2 rounded-lg border p-4 cursor-pointer ${
                          selectedModels.includes(model.id) ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                        }`}
                        onClick={() => handleModelToggle(model.id)}
                      >
                        <Checkbox checked={selectedModels.includes(model.id)} />
                        <Label className="cursor-pointer">{model.display_name}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader><CardTitle>Test Prompt</CardTitle></CardHeader>
              <CardContent>
                <Textarea placeholder="Enter your prompt..." value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="mb-4" />
                <Button onClick={handleSendPrompt} disabled={selectedModels.length === 0 || !prompt.trim() || isLoading} className="w-full">
                  {isLoading ? 'Loading...' : <><Send className="mr-2 h-4 w-4" />Send</>}
                </Button>
              </CardContent>
            </Card>

            {responses.length > 0 && (
              <div className="space-y-4">
                {responses.map((r, i) => (
                  <Card key={i}>
                    <CardHeader><CardTitle className="text-base">{r.model}</CardTitle></CardHeader>
                    <CardContent><p className="text-sm">{r.text}</p></CardContent>
                  </Card>
                ))}
              </div>
            )}
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
      </div>
    </div>
  )
}
