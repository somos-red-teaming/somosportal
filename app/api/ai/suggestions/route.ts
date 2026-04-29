import { NextRequest, NextResponse } from 'next/server'
import { AIProviderFactory } from '@/lib/ai-providers/factory'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { modelId, userPrompt, aiResponse, exerciseContext } = await request.json()

    if (!modelId || !userPrompt || !aiResponse) {
      return NextResponse.json({ suggestions: [] })
    }

    const { data: model } = await supabaseAdmin
      .from('ai_models')
      .select('*')
      .eq('id', modelId)
      .single()

    if (!model) return NextResponse.json({ suggestions: [] })

    const provider = AIProviderFactory.createProvider(model)
    const prompt = `${exerciseContext || ''}\n\nGiven this exchange, suggest 3 short follow-up questions (max 12 words each) a user might ask next to explore this topic further. Return ONLY a JSON array of 3 strings.\n\nUser: "${userPrompt}"\nAssistant: "${aiResponse.slice(0, 500)}"`

    const response = await provider.generateText(prompt, {
      model: model.model_id,
      maxTokens: 200,
      temperature: 0.7
    })

    // Parse suggestions
    const match = response.content.match(/\[[\s\S]*?\]/)
    if (match) {
      const parsed = JSON.parse(match[0])
      if (Array.isArray(parsed)) {
        return NextResponse.json({ suggestions: parsed.slice(0, 3) })
      }
    }

    // Fallback: extract lines ending with ?
    const lines = response.content.split('\n')
      .map((l: string) => l.replace(/^[\d\.\-\*\•]+\s*["']?/, '').replace(/["']?\s*$/, '').trim())
      .filter((l: string) => l.length > 10 && l.length < 100 && l.endsWith('?'))
    if (lines.length >= 2) {
      return NextResponse.json({ suggestions: lines.slice(0, 3) })
    }

    return NextResponse.json({ suggestions: [] })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
