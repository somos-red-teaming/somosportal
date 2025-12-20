'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface AIModel {
  id: string
  name: string
  provider: string
  is_active: boolean
}

const providerEmojis: Record<string, string> = {
  google: '🟢',
  groq: '🟣',
  openai: '🔵',
  anthropic: '🟠',
  custom: '⚪'
}

export default function ApiTesterPage() {
  const [models, setModels] = useState<AIModel[]>([])
  const [exerciseId, setExerciseId] = useState('test-exercise')
  const [modelId, setModelId] = useState('')
  const [prompt, setPrompt] = useState('Hello, how are you?')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchModels()
  }, [])

  /**
   * Fetches active AI models from the database
   */
  const fetchModels = async () => {
    const { data } = await supabase
      .from('ai_models')
      .select('id, name, provider, is_active')
      .eq('is_active', true)
      .order('name')
    
    setModels(data || [])
  }

  const selectedModel = models.find(m => m.id === modelId)

  /**
   * Tests AI chat endpoint with selected model
   */
  const testChat = async () => {
    if (!modelId) {
      alert('Please select a model')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId, modelId, prompt })
      })
      
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setResponse(`Error: ${error}`)
    }
    setLoading(false)
  }

  /**
   * Tests AI model connection endpoint
   */
  const testConnection = async () => {
    if (!modelId) {
      alert('Please select a model')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/test/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId })
      })
      
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setResponse(`Error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">AI API Tester</h1>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test AI APIs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Exercise ID</label>
                  <Input 
                    value={exerciseId}
                    onChange={(e) => setExerciseId(e.target.value)}
                    placeholder="test-exercise"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">AI Model</label>
                  <Select value={modelId} onValueChange={setModelId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI model to test" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div>
                            <div className="font-medium">
                              {providerEmojis[model.provider] || '⚪'} {model.name}
                            </div>
                            <div className="text-xs text-muted-foreground">Provider: {model.provider}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedModel && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-black">
                      <strong>Provider:</strong> {selectedModel.provider} <br/>
                      <strong>Model ID:</strong> <code>{selectedModel.id}</code>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Prompt</label>
                  <Textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={testChat} 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Testing...' : 'Test Chat'}
                  </Button>
                  
                  <Button 
                    onClick={testConnection} 
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                  >
                    {loading ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>API Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap text-black">
                  {response || 'Select a model and click "Test Chat" or "Test Connection" to see the API response here.'}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}
