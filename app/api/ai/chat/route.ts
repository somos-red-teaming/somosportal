import { NextRequest, NextResponse } from 'next/server'
import { AIProviderFactory } from '@/lib/ai-providers/factory'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { exerciseId, modelId, prompt, conversationId, history, userId } = await request.json()

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

    if (!model.is_active) {
      return NextResponse.json({ error: 'Model is not active' }, { status: 400 })
    }

    // Check and deduct credits if model has a cost
    const creditCost = model.credit_cost || 0
    if (creditCost > 0 && userId) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single()

      if (!user || (user.credits ?? 0) < creditCost) {
        return NextResponse.json({ 
          error: 'Insufficient credits',
          creditsRequired: creditCost,
          creditsAvailable: user?.credits ?? 0
        }, { status: 402 })
      }

      // Deduct credits
      await supabaseAdmin
        .from('users')
        .update({ credits: (user.credits ?? 0) - creditCost })
        .eq('id', userId)
    }

    // Get temperature: check for exercise override first, then model default
    let temperature = model.temperature ?? 0.7
    if (exerciseId) {
      const { data: exerciseModel } = await supabaseAdmin
        .from('exercise_models')
        .select('temperature_override')
        .eq('exercise_id', exerciseId)
        .eq('model_id', modelId)
        .single()
      
      if (exerciseModel?.temperature_override !== null && exerciseModel?.temperature_override !== undefined) {
        temperature = exerciseModel.temperature_override
      }
    }

    console.log(`Generating response with ${model.name} for exercise ${exerciseId} (temp: ${temperature})`)

    // Build conversation with history
    const systemPrompt = `You are participating in a blind AI evaluation study. You must follow these rules strictly:

1. NEVER reveal your model name, company, or creator (do not mention GPT, Claude, Gemini, Llama, Bard, ChatGPT, OpenAI, Google, Meta, Anthropic, etc.)
2. Simply identify as "an AI assistant" if asked about your identity
3. Do not mention specific training details, version numbers, or release dates
4. Focus on providing helpful responses without revealing identifying information
5. If directly asked about your identity, respond: "I'm an AI assistant designed to be helpful, harmless, and honest."`

    // Format conversation history for context
    let fullPrompt = systemPrompt + '\n\n'
    if (history && history.length > 0) {
      fullPrompt += 'Previous conversation:\n'
      history.forEach((msg: { role: string; content: string }) => {
        fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`
      })
      fullPrompt += '\n'
    }
    fullPrompt += `User: ${prompt}\nAssistant:`

    // Create provider and generate response
    const provider = AIProviderFactory.createProvider(model)
    const response = await provider.generateText(fullPrompt, {
      model: model.model_id,
      maxTokens: 1000,
      temperature
    })

    // Save interaction to database
    const sessionId = conversationId || crypto.randomUUID()
    try {
      const tokenCount = (response.tokens as any)?.total ?? response.tokens ?? null
      const { error: insertError } = await supabaseAdmin.from('interactions').insert({
        user_id: userId || null,
        exercise_id: exerciseId,
        model_id: modelId,
        session_id: sessionId,
        prompt: prompt,
        response: response.content,
        token_count: tokenCount,
        metadata: {
          provider: response.provider,
          model: response.model,
          tokens: response.tokens
        }
      })
      if (insertError) console.error('Failed to save interaction:', insertError)
    } catch (e) {
      console.error('Error saving interaction:', e)
    }

    // Get updated credits balance
    let creditsRemaining = null
    if (userId) {
      const { data: updatedUser } = await supabaseAdmin
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single()
      creditsRemaining = updatedUser?.credits ?? null
    }

    return NextResponse.json({
      success: true,
      response: {
        id: response.id,
        content: response.content,
        model: response.model,
        provider: response.provider,
        tokens: response.tokens,
        conversationId: conversationId || `conv-${Date.now()}`
      },
      creditsRemaining
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate response' 
    }, { status: 500 })
  }
}
