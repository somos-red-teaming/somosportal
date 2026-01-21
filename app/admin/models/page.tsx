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
  configuration: Record<string, string>
  credit_cost: number
  temperature: number
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
  configuration: {} as Record<string, string>,
  credit_cost: 0,
  temperature: 0.7,
  is_active: true,
  is_public: true
}

const providerOptions = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'groq', label: 'Groq' },
  { value: 'huggingface', label: 'Hugging Face' },
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
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string; context_window?: number }[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  useEffect(() => {
    fetchModels()
  }, [])

  // Fetch available models when provider changes
  useEffect(() => {
    if (form.provider && dialogOpen) {
      fetchAvailableModels(form.provider)
    }
  }, [form.provider, dialogOpen])

  const fetchAvailableModels = async (provider: string) => {
    setLoadingModels(true)
    try {
      const res = await fetch(`/api/models/list?provider=${provider}`)
      const data = await res.json()
      setAvailableModels(data.models || [])
    } catch (e) {
      setAvailableModels([])
    }
    setLoadingModels(false)
  }

  const fetchModels = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ai_models')
      .select('*')
      .order('created_at', { ascending: false })
    setModels(data || [])
    setLoading(false)
  }

  /**
   * Save model to database
   * Includes configuration for custom providers (endpoint, apiKeyEnv)
   */
  const handleSave = async () => {
    const modelData = {
      ...form,
      capabilities: form.capabilities.length > 0 ? form.capabilities : ['text_generation'],
      // Only include configuration for custom providers
      configuration: form.provider === 'custom' ? form.configuration : {}
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

  /**
   * Load model data into form for editing
   * Includes configuration for custom provider settings
   */
  const handleEdit = (model: AIModel) => {
    setForm({
      name: model.name,
      display_name: model.display_name,
      provider: model.provider,
      model_id: model.model_id,
      description: model.description || '',
      capabilities: model.capabilities || [],
      configuration: model.configuration || {},
      credit_cost: model.credit_cost || 0,
      temperature: model.temperature ?? 0.7,
      is_active: model.is_active,
      is_public: true
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
                      {loadingModels ? (
                        <div className="h-10 flex items-center text-sm text-muted-foreground">Loading models...</div>
                      ) : availableModels.length > 0 ? (
                        <Select value={form.model_id} onValueChange={(v) => {
                          const selected = availableModels.find((m: any) => m.id === v)
                          let caps = form.capabilities
                          // Auto-fill capabilities for HuggingFace based on pipeline_tag
                          if (form.provider === 'huggingface' && selected?.pipeline_tag) {
                            const tagMap: Record<string, string[]> = {
                              'text-to-image': ['image_generation'],
                              'text-generation': ['text_generation', 'conversation'],
                              'image-to-text': ['vision', 'multimodal'],
                              'visual-question-answering': ['vision', 'multimodal'],
                            }
                            caps = tagMap[selected.pipeline_tag] || []
                          }
                          setForm({ ...form, model_id: v, capabilities: caps })
                        }}>
                          <SelectTrigger>
                            <span className="truncate max-w-[180px] block">
                              {form.model_id ? (form.model_id.length > 25 ? form.model_id.slice(0, 25) + '...' : form.model_id) : 'Select a model'}
                            </span>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {availableModels.map((m: any) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} {m.context_window ? `(${Math.round(m.context_window/1000)}k)` : ''}{m.downloads ? ` • ${(m.downloads/1000).toFixed(0)}k` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input 
                          value={form.model_id} 
                          onChange={(e) => setForm({ ...form, model_id: e.target.value })}
                          placeholder="e.g., gpt-4, claude-3-sonnet"
                        />
                      )}
                      {form.provider === 'huggingface' && (
                        <Input 
                          className="mt-2"
                          placeholder="Search models (e.g., flux, stable-diffusion)..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const search = (e.target as HTMLInputElement).value
                              fetch(`/api/models/list?provider=huggingface&search=${encodeURIComponent(search)}`)
                                .then(r => r.json())
                                .then(d => setAvailableModels(d.models || []))
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Credit Cost per Message</Label>
                      <Input 
                        type="number"
                        min="0"
                        value={form.credit_cost} 
                        onChange={(e) => setForm({ ...form, credit_cost: parseInt(e.target.value) || 0 })}
                        placeholder="0 = free"
                      />
                      <p className="text-xs text-muted-foreground mt-1">0 = free, 1+ = deducts from user credits</p>
                    </div>
                    <div>
                      <Label>Temperature (0.0 - 2.0)</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={form.temperature} 
                        onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) || 0.7 })}
                        placeholder="0.7"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        0 = deterministic • 0.3-0.5 = focused • 0.7 = balanced • 1.0+ = creative
                      </p>
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
                  
                  {/* Custom provider configuration fields */}
                  {form.provider === 'custom' && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <Label className="text-base font-semibold">Custom Provider Settings</Label>
                      <div>
                        <Label>Endpoint URL *</Label>
                        <Input 
                          value={form.configuration.endpoint || ''} 
                          onChange={(e) => setForm({ 
                            ...form, 
                            configuration: { ...form.configuration, endpoint: e.target.value }
                          })}
                          placeholder="https://your-api.com/v1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Full URL to your API endpoint (must support /chat/completions)
                        </p>
                      </div>
                      <div>
                        <Label>API Key Environment Variable *</Label>
                        <Input 
                          value={form.configuration.apiKeyEnv || ''} 
                          onChange={(e) => setForm({ 
                            ...form, 
                            configuration: { ...form.configuration, apiKeyEnv: e.target.value }
                          })}
                          placeholder="MY_CUSTOM_API_KEY"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Name of the env var containing the API key (must be set on server)
                        </p>
                      </div>
                    </div>
                  )}
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
                          {model.credit_cost > 0 && <span className="ml-2 text-amber-600">• {model.credit_cost} credit/msg</span>}
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
                    {/* Show custom provider config info */}
                    {model.provider === 'custom' && model.configuration?.endpoint && (
                      <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm">
                        <span className="font-medium">Endpoint:</span> {model.configuration.endpoint}
                        {model.configuration.apiKeyEnv && (
                          <span className="ml-3"><span className="font-medium">Key:</span> ${model.configuration.apiKeyEnv}</span>
                        )}
                      </div>
                    )}
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
