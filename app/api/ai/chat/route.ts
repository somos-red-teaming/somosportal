import { NextRequest, NextResponse } from 'next/server'
import { AIProviderFactory } from '@/lib/ai-providers/factory'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { exerciseId, modelId, prompt, conversationId } = await request.json()

    // Validate required fields
    if (!exerciseId || !modelId || !prompt) {
      return NextResponse.json({ 
        error: 'Missing required fields: exerciseId, modelId, prompt' 
      }, { status: 400 })
    }

    // Get model config from database
    const { data: model, error: modelError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', modelId)
      .single()

    if (modelError || !model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    // Check if model is active
    if (!model.is_active) {
      return NextResponse.json({ error: 'Model is not active' }, { status: 400 })
    }

    console.log(`Generating response with ${model.name} for exercise ${exerciseId}`)

    // Create system prompt to prevent AI identity revelation for blind testing
    const systemPrompt = `You are participating in a blind AI evaluation study. You must follow these rules strictly:

1. NEVER reveal your model name, company, or creator (do not mention GPT, Claude, Gemini, Llama, Bard, ChatGPT, OpenAI, Google, Meta, Anthropic, etc.)
2. Simply identify as "an AI assistant" if asked about your identity
3. Do not mention specific training details, version numbers, or release dates
4. Focus on providing helpful responses without revealing identifying information
5. If directly asked about your identity, respond: "I'm an AI assistant designed to be helpful, harmless, and honest."

User prompt: ${prompt}`

    // Create provider and generate response with system prompt
    const provider = AIProviderFactory.createProvider(model)
    const response = await provider.generateText(systemPrompt, {
      model: model.model_id,
      maxTokens: 1000,
      temperature: 0.7
    })

    // TODO: Save interaction to database
    // This will be implemented when we connect to the frontend

    return NextResponse.json({
      success: true,
      response: {
        id: response.id,
        content: response.content,
        model: response.model,
        provider: response.provider,
        tokens: response.tokens,
        conversationId: conversationId || `conv-${Date.now()}`
      }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate response' 
    }, { status: 500 })
  }
}
