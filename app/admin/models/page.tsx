'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Pencil, Trash2, TestTube, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface AIModel {
  id: string
  name: string
  display_name: string
  provider: string
  model_id: string
  description: string
  capabilities: string[]
  is_active: boolean
  is_public: boolean
  created_at: string
}

const emptyModel = {
  name: '',
  display_name: '',
  provider: 'openai',
  model_id: '',
  description: '',
  capabilities: [] as string[],
  configuration: {},
  is_active: true,
  is_public: true // Always true, controlled by exercise assignment
}

const providerOptions = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'groq', label: 'Groq' },
  { value: 'custom', label: 'Custom' }
]

const capabilityOptions = [
  'text_generation',
  'image_generation',
  'conversation',
  'analysis',
  'reasoning',
  'coding',
  'vision',
  'multimodal'
]

export default function AdminModelsPage() {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyModel)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [testErrors, setTestErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ai_models')
      .select('*')
      .order('created_at', { ascending: false })
    setModels(data || [])
    setLoading(false)
  }

  const handleSave = async () => {
    const modelData = {
      ...form,
      capabilities: form.capabilities.length > 0 ? form.capabilities : ['text_generation']
    }

    if (editingId) {
      await supabase.from('ai_models').update(modelData).eq('id', editingId)
    } else {
      await supabase.from('ai_models').insert(modelData)
    }

    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyModel)
    fetchModels()
  }

  const handleEdit = (model: AIModel) => {
    setForm({
      name: model.name,
      display_name: model.display_name,
      provider: model.provider,
      model_id: model.model_id,
      description: model.description || '',
      capabilities: model.capabilities || [],
      configuration: {},
      is_active: model.is_active,
      is_public: true // Always true, controlled by exercise assignment
    })
    setEditingId(model.id)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this AI model? This cannot be undone.')) return
    await supabase.from('ai_models').delete().eq('id', id)
    fetchModels()
  }

  const handleTest = async (model: AIModel) => {
    console.log('Testing model:', model.name, model.id)
    setTesting(model.id)
    setTestErrors(prev => ({ ...prev, [model.id]: '' })) // Clear previous error
    try {
      // Test connection via API
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: model.id })
      })
      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Test result:', result)
      setTestResults(prev => ({ ...prev, [model.id]: result.success }))
      
      // Store error message if test failed
      if (!result.success && result.error) {
        setTestErrors(prev => ({ ...prev, [model.id]: result.error }))
      }
    } catch (error) {
      console.error('Test error:', error)
      setTestResults(prev => ({ ...prev, [model.id]: false }))
      setTestErrors(prev => ({ ...prev, [model.id]: 'Network error' }))
    }
    setTesting(null)
  }

  const toggleCapability = (capability: string) => {
    setForm(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...prev.capabilities, capability]
    }))
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <h1 className="text-3xl font-bold">AI Model Management</h1>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) { setEditingId(null); setForm(emptyModel) }
            }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Model</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit AI Model' : 'Add AI Model'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name *</Label>
                      <Input 
                        value={form.name} 
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g., GPT-4"
                      />
                    </div>
                    <div>
                      <Label>Display Name (Blind) *</Label>
                      <Input 
                        value={form.display_name} 
                        onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                        placeholder="e.g., Model Alpha"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Provider *</Label>
                      <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {providerOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Model ID *</Label>
                      <Input 
                        value={form.model_id} 
                        onChange={(e) => setForm({ ...form, model_id: e.target.value })}
                        placeholder="e.g., gpt-4, claude-3-sonnet"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea 
                      value={form.description} 
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Brief description of the model"
                    />
                  </div>
                  <div>
                    <Label>Capabilities</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {capabilityOptions.map(capability => (
                        <div key={capability} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={form.capabilities.includes(capability)}
                            onChange={() => toggleCapability(capability)}
                            className="rounded"
                          />
                          <Label className="text-sm capitalize">{capability.replace('_', ' ')}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                  <Button onClick={handleSave} className="w-full">
                    {editingId ? 'Update Model' : 'Add Model'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              {models.map((model) => (
                <Card key={model.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {model.name}
                          <Badge variant={model.is_active ? 'default' : 'secondary'}>
                            {model.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {model.display_name} • {model.provider} • {model.model_id}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(model)}
                          disabled={testing === model.id}
                          data-testid="test-button"
                        >
                          {testing === model.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                        {testResults[model.id] !== undefined && (
                          testResults[model.id] ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleEdit(model)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(model.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{model.description}</p>
                    {testErrors[model.id] && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <strong>Test Error:</strong> {testErrors[model.id]}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {model.capabilities?.map(capability => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  )
}
