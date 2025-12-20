import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * API endpoint for AI image generation
 * Routes to appropriate provider based on model
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, modelId, blindName } = await request.json()

    if (!prompt || !modelId) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, modelId' },
        { status: 400 }
      )
    }

    // Get model info from database to determine provider
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Looking for model with ID:', modelId) // Debug log

    const { data: model, error } = await supabase
      .from('ai_models')
      .select('provider, model_id')
      .eq('id', modelId)
      .single()

    console.log('Model query result:', { model, error }) // Debug log

    if (!model) {
      return NextResponse.json({
        id: `img_${Date.now()}`,
        imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=Model+Not+Found',
        model: blindName,
        provider: 'error',
        prompt: prompt,
        metadata: { error: `Model not found: ${modelId}` }
      })
    }

    // Only allow image generation for models that actually support it
    if (model.provider === 'google') {
      return await generateGoogleImage(prompt, blindName)
    } else if (model.provider === 'openai') {
      return await generateDallEImage(prompt, blindName)
    } else {
      // Model doesn't support image generation
      return NextResponse.json({
        id: `img_${Date.now()}`,
        imageUrl: 'https://via.placeholder.com/512x512/6B7280/FFFFFF?text=Image+Generation+Not+Supported',
        model: blindName,
        provider: model.provider,
        prompt: prompt,
        metadata: { 
          error: `${blindName} doesn't support image generation`,
          supportedFeatures: ['text']
        }
      })
    }

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'I\'m currently unavailable. Please try again later.' },
      { status: 500 }
    )
  }
}

/**
 * Generate image using Google Gemini (Nano Banana 🍌)
 */
async function generateGoogleImage(prompt: string, blindName: string) {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      id: `img_${Date.now()}`,
      imageUrl: 'https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=Google+API+Key+Missing',
      model: blindName,
      provider: 'google-gemini',
      prompt: prompt,
      metadata: { error: 'API key not configured' }
    })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" })

    const result = await model.generateContent(prompt)
    const response = await result.response
    
    // Extract the image data
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)
    const base64Data = part?.inlineData?.data

    if (!base64Data) {
      return NextResponse.json({
        id: `img_${Date.now()}`,
        imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=Nano+Banana+Failed',
        model: blindName,
        provider: 'google-gemini',
        prompt: prompt,
        metadata: { error: 'No image data returned' }
      })
    }

    return NextResponse.json({
      id: `img_${Date.now()}`,
      imageUrl: `data:image/png;base64,${base64Data}`,
      model: blindName,
      provider: 'google-gemini',
      prompt: prompt,
      metadata: {
        size: 'variable',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Google image generation error:', error)
    return NextResponse.json({
      id: `img_${Date.now()}`,
      imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=Nano+Banana+Error',
      model: blindName,
      provider: 'google-gemini',
      prompt: prompt,
      metadata: { error: error.message }
    })
  }
}

/**
 * Generate image using DALL-E 3 (fallback for non-Google models)
 */
async function generateDallEImage(prompt: string, blindName: string) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      id: `img_${Date.now()}`,
      imageUrl: 'https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=OpenAI+API+Key+Missing',
      model: blindName,
      provider: 'dall-e-3',
      prompt: prompt,
      metadata: { error: 'API key not configured' }
    })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url'
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('DALL-E 3 API error:', error)
      
      return NextResponse.json({
        id: `img_${Date.now()}`,
        imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=DALL-E+Failed',
        model: blindName,
        provider: 'dall-e-3',
        prompt: prompt,
        metadata: { error: 'Generation failed' }
      })
    }

    const data = await response.json()
    const imageUrl = data.data?.[0]?.url

    if (!imageUrl) {
      return NextResponse.json({
        id: `img_${Date.now()}`,
        imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=No+Image+Returned',
        model: blindName,
        provider: 'dall-e-3',
        prompt: prompt,
        metadata: { error: 'No image URL returned' }
      })
    }

    return NextResponse.json({
      id: `img_${Date.now()}`,
      imageUrl: imageUrl,
      model: blindName,
      provider: 'dall-e-3',
      prompt: prompt,
      metadata: {
        size: '1024x1024',
        quality: 'standard',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('DALL-E 3 generation error:', error)
    return NextResponse.json({
      id: `img_${Date.now()}`,
      imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=DALL-E+Error',
      model: blindName,
      provider: 'dall-e-3',
      prompt: prompt,
      metadata: { error: error.message }
    })
  }
}
