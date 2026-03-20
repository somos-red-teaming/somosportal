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
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        }
      })
      const data = await res.json()
      models = (data.data || []).map((m: any) => ({
        id: m.id,
        name: m.display_name || m.id,
        context_window: m.max_input_tokens
      }))
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
