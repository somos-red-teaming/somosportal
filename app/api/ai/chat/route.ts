import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AIProviderFactory } from '@/lib/ai-providers/factory'

export async function POST(request: NextRequest) {
  try {
    const { exerciseId, modelId, prompt, conversationId } = await request.json()

    // Validate required fields
    if (!exerciseId || !modelId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: exerciseId, modelId, prompt' },
        { status: 400 }
      )
    }

    // Get model configuration from database
    const { data: modelConfig, error: modelError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', modelId)
      .eq('is_active', true)
      .single()

    if (modelError || !modelConfig) {
      return NextResponse.json(
        { error: 'Model not found or inactive' },
        { status: 404 }
      )
    }

    // Get blind name for this model in this exercise
    const { data: exerciseModel } = await supabase
      .from('exercise_models')
      .select('blind_name')
      .eq('exercise_id', exerciseId)
      .eq('model_id', modelId)
      .single()

    if (!exerciseModel) {
      return NextResponse.json(
        { error: 'Model not assigned to this exercise' },
        { status: 400 }
      )
    }

    // Create AI provider and generate response
    const provider = AIProviderFactory.createProvider(modelConfig)
    const aiResponse = await provider.generateText(prompt, {
      model: modelConfig.model_id,
      maxTokens: modelConfig.configuration?.max_tokens || 1000,
      temperature: modelConfig.configuration?.temperature || 0.7
    })

    // Store interaction in database
    const { data: interaction, error: interactionError } = await supabase
      .from('interactions')
      .insert({
        exercise_id: exerciseId,
        model_id: modelId,
        session_id: conversationId || `session-${Date.now()}`,
        prompt,
        response: aiResponse.content,
        response_time_ms: Date.now(), // Placeholder
        token_count: aiResponse.tokens,
        metadata: {
          provider: aiResponse.provider,
          model: aiResponse.model,
          finish_reason: aiResponse.finishReason,
          ...aiResponse.metadata
        }
      })
      .select()
      .single()

    if (interactionError) {
      console.error('Failed to store interaction:', interactionError)
      // Continue anyway, don't fail the request
    }

    // Return response with blind name
    return NextResponse.json({
      id: aiResponse.id,
      content: aiResponse.content,
      model: exerciseModel.blind_name, // Return blind name, not real model
      provider: 'hidden', // Hide real provider
      tokens: aiResponse.tokens,
      conversationId: conversationId || `session-${Date.now()}`,
      interactionId: interaction?.id
    })

  } catch (error) {
    console.error('AI Chat API Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
