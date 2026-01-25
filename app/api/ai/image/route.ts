import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface ImageResult {
  id: string
  imageUrl: string
  model: string
  provider: string
  prompt: string
  metadata: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, modelId, blindName, exerciseId, userId, conversationId } = await request.json()

    if (!prompt || !modelId) {
      return NextResponse.json({ error: 'Missing required fields: prompt, modelId' }, { status: 400 })
    }

    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const sessionId = conversationId || crypto.randomUUID()

    const { data: model } = await supabase
      .from('ai_models')
      .select('provider, model_id')
      .eq('id', modelId)
      .single()

    if (!model) {
      return NextResponse.json({
        id: `img_${Date.now()}`,
        imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=Model+Not+Found',
        model: blindName,
        provider: 'error',
        prompt,
        metadata: { error: `Model not found: ${modelId}` }
      })
    }

    // Generate image
    let result: ImageResult
    if (model.provider === 'google') {
      result = await generateGoogleImage(prompt, blindName)
    } else if (model.provider === 'openai') {
      result = await generateDallEImage(prompt, blindName)
    } else if (model.provider === 'huggingface') {
      result = await generateHuggingFaceImage(prompt, blindName, model.model_id)
    } else {
      result = {
        id: `img_${Date.now()}`,
        imageUrl: 'https://via.placeholder.com/512x512/6B7280/FFFFFF?text=Not+Supported',
        model: blindName,
        provider: model.provider,
        prompt,
        metadata: { error: `${blindName} doesn't support image generation` }
      }
    }
    
    // Save interaction
    if (exerciseId) {
      try {
        let storedImageUrl = result.imageUrl
        
        if (result.imageUrl?.startsWith('data:')) {
          const base64Data = result.imageUrl.split(',')[1]
          const buffer = Buffer.from(base64Data, 'base64')
          const filename = `${sessionId}/${Date.now()}.png`
          
          const { error: uploadError } = await supabase.storage
            .from('generated-images')
            .upload(filename, buffer, { contentType: 'image/png' })
          
          if (!uploadError) {
            storedImageUrl = `storage:generated-images/${filename}`
          }
        }
        
        await supabase.from('interactions').insert({
          user_id: userId || null,
          exercise_id: exerciseId,
          model_id: modelId,
          session_id: sessionId,
          prompt,
          response: storedImageUrl,
          metadata: { type: 'image', provider: result.provider, ...result.metadata }
        })
      } catch (e) {
        console.error('Error saving image interaction:', e)
      }
    }
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
  }
}

async function generateGoogleImage(prompt: string, blindName: string): Promise<ImageResult> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return { id: `img_${Date.now()}`, imageUrl: 'https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=API+Key+Missing', model: blindName, provider: 'google', prompt, metadata: { error: 'API key not configured' } }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp-image-generation" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)
    const base64Data = part?.inlineData?.data

    if (!base64Data) {
      return { id: `img_${Date.now()}`, imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=No+Image', model: blindName, provider: 'google', prompt, metadata: { error: 'No image data' } }
    }

    return { id: `img_${Date.now()}`, imageUrl: `data:image/png;base64,${base64Data}`, model: blindName, provider: 'google', prompt, metadata: { timestamp: new Date().toISOString() } }
  } catch (error) {
    return { id: `img_${Date.now()}`, imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=Error', model: blindName, provider: 'google', prompt, metadata: { error: String(error) } }
  }
}

async function generateDallEImage(prompt: string, blindName: string): Promise<ImageResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { id: `img_${Date.now()}`, imageUrl: 'https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=API+Key+Missing', model: blindName, provider: 'openai', prompt, metadata: { error: 'API key not configured' } }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'standard', response_format: 'url' }),
    })

    if (!response.ok) {
      return { id: `img_${Date.now()}`, imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=Failed', model: blindName, provider: 'openai', prompt, metadata: { error: 'Generation failed' } }
    }

    const data = await response.json()
    const imageUrl = data.data?.[0]?.url
    if (!imageUrl) {
      return { id: `img_${Date.now()}`, imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=No+Image', model: blindName, provider: 'openai', prompt, metadata: { error: 'No URL returned' } }
    }

    return { id: `img_${Date.now()}`, imageUrl, model: blindName, provider: 'openai', prompt, metadata: { size: '1024x1024', timestamp: new Date().toISOString() } }
  } catch (error) {
    return { id: `img_${Date.now()}`, imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=Error', model: blindName, provider: 'openai', prompt, metadata: { error: String(error) } }
  }
}

async function generateHuggingFaceImage(prompt: string, blindName: string, modelId: string = 'black-forest-labs/FLUX.1-schnell'): Promise<ImageResult> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    return { id: `img_${Date.now()}`, imageUrl: 'https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=API+Key+Missing', model: blindName, provider: 'huggingface', prompt, metadata: { error: 'API key not configured' } }
  }

  try {
    const response = await fetch(`https://router.huggingface.co/hf-inference/models/${modelId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt, parameters: { seed: Math.floor(Math.random() * 2147483647) } }),
    })

    if (!response.ok) {
      return { id: `img_${Date.now()}`, imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=Failed', model: blindName, provider: 'huggingface', prompt, metadata: { error: 'Generation failed' } }
    }

    const imageBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')

    return { id: `img_${Date.now()}`, imageUrl: `data:image/png;base64,${base64}`, model: blindName, provider: 'huggingface', prompt, metadata: { modelId, timestamp: new Date().toISOString() } }
  } catch (error) {
    return { id: `img_${Date.now()}`, imageUrl: 'https://via.placeholder.com/512x512/EF4444/FFFFFF?text=Error', model: blindName, provider: 'huggingface', prompt, metadata: { error: String(error) } }
  }
}
