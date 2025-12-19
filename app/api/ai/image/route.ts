import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AIProviderFactory } from '@/lib/ai-providers/factory'

export async function POST(request: NextRequest) {
  try {
    const { exerciseId, modelId, prompt, options } = await request.json()

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

    // Check if model supports image generation
    if (!modelConfig.capabilities?.includes('image_generation')) {
      return NextResponse.json(
        { error: 'Model does not support image generation' },
        { status: 400 }
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

    // Create AI provider and generate image
    const provider = AIProviderFactory.createProvider(modelConfig)
    
    if (!provider.generateImage) {
      return NextResponse.json(
        { error: 'Provider does not support image generation' },
        { status: 400 }
      )
    }

    const aiResponse = await provider.generateImage(prompt, {
      size: options?.size || '1024x1024',
      quality: options?.quality || 'standard',
      style: options?.style
    })

    // Store interaction in database
    const { data: interaction, error: interactionError } = await supabase
      .from('interactions')
      .insert({
        exercise_id: exerciseId,
        model_id: modelId,
        session_id: `img-session-${Date.now()}`,
        prompt,
        response: aiResponse.imageUrl,
        response_time_ms: Date.now(), // Placeholder
        metadata: {
          type: 'image',
          provider: aiResponse.provider,
          model: aiResponse.model,
          image_url: aiResponse.imageUrl,
          ...aiResponse.metadata
        }
      })
      .select()
      .single()

    if (interactionError) {
      console.error('Failed to store image interaction:', interactionError)
      // Continue anyway, don't fail the request
    }

    // Return response with blind name
    return NextResponse.json({
      id: aiResponse.id,
      imageUrl: aiResponse.imageUrl,
      model: exerciseModel.blind_name, // Return blind name
      provider: 'hidden', // Hide real provider
      type: 'image',
      interactionId: interaction?.id,
      metadata: {
        size: options?.size || '1024x1024',
        quality: options?.quality || 'standard',
        // Include safe metadata, hide sensitive info
        ...(aiResponse.metadata?.note ? { note: aiResponse.metadata.note } : {})
      }
    })

  } catch (error) {
    console.error('AI Image API Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate AI image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
