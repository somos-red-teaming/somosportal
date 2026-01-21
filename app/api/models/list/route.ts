import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider')
  const search = searchParams.get('search') || ''

  if (!provider) {
    return NextResponse.json({ error: 'Provider required' }, { status: 400 })
  }

  try {
    let models: { id: string; name: string; context_window?: number }[] = []

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
      })
      const data = await res.json()
      models = (data.data || [])
        .filter((m: any) => m.id.startsWith('gpt'))
        .map((m: any) => ({ id: m.id, name: m.id }))
    }

    if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
      })
      const data = await res.json()
      models = (data.data || [])
        .filter((m: any) => m.active)
        .map((m: any) => ({ id: m.id, name: m.id, context_window: m.context_window }))
    }

    if (provider === 'google') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`)
      const data = await res.json()
      models = (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => ({ 
          id: m.name.replace('models/', ''), 
          name: m.displayName,
          context_window: m.inputTokenLimit
        }))
    }

    if (provider === 'anthropic') {
      // Anthropic doesn't have a models list API, return known models
      models = [
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
      ]
    }

    if (provider === 'huggingface') {
      // Search HuggingFace models - default to text-to-image task
      const task = searchParams.get('task') || 'text-to-image'
      const query = search ? `&search=${encodeURIComponent(search)}` : ''
      const res = await fetch(
        `https://huggingface.co/api/models?pipeline_tag=${task}&sort=downloads&direction=-1&limit=20${query}`,
        { headers: process.env.HUGGINGFACE_API_KEY ? { 'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}` } : {} }
      )
      const data = await res.json()
      models = (data || []).map((m: any) => ({
        id: m.id,
        name: m.id,
        downloads: m.downloads,
        pipeline_tag: m.pipeline_tag
      }))
    }

    return NextResponse.json({ models })
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
  }
}
