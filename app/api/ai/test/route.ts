import { NextRequest, NextResponse } from 'next/server'
import { AIProviderFactory } from '@/lib/ai-providers/factory'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/ai/test
 * Tests AI model connection and configuration
 * @param request - Request containing modelId in body
 * @returns JSON response with test result
 */
export async function POST(request: NextRequest) {
  try {
    const { modelId } = await request.json()

    if (!modelId) {
      return NextResponse.json({ error: 'Model ID required' }, { status: 400 })
    }

    // Get model config from database
    const supabase = await createClient()
    const { data: model, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', modelId)
      .single()

    if (error || !model) {
      console.error('Model not found:', error)
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    console.log('Testing model:', model.name, model.provider)

    try {
      // Create provider and test connection
      const provider = AIProviderFactory.createProvider(model)
      const success = await provider.testConnection()

      console.log('Test result for', model.name, ':', success)

      if (success) {
        return NextResponse.json({ success: true })
      } else {
        // If test failed, try to get the error from the provider
        return NextResponse.json({ 
          success: false, 
          error: `${model.provider} API connection failed. Check your API key and credits.`
        })
      }
    } catch (providerError) {
      console.error('Provider test error:', providerError)
      const errorMessage = providerError instanceof Error ? providerError.message : 'Provider connection failed'
      return NextResponse.json({ 
        success: false, 
        error: errorMessage
      })
    }
  } catch (error) {
    console.error('Test connection error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      success: false, 
      error: errorMessage
    }, { status: 500 })
  }
}
