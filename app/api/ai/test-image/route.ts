import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { modelId } = await request.json()

    if (!modelId) {
      return NextResponse.json({ success: false, error: 'Missing modelId' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: model } = await supabase
      .from('ai_models')
      .select('provider, model_id, name')
      .eq('id', modelId)
      .single()

    if (!model) {
      return NextResponse.json({ success: false, error: 'Model not found' }, { status: 404 })
    }

    // Test based on provider
    if (model.provider === 'modelscope') {
      const apiKey = process.env.MODELSCOPE_API_KEY
      if (!apiKey) {
        return NextResponse.json({ success: false, error: 'MODELSCOPE_API_KEY not configured' })
      }

      // Step 1: Submit task
      const submitResponse = await fetch('https://api-inference.modelscope.cn/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-ModelScope-Async-Mode': 'true'
        },
        body: JSON.stringify({
          model: 'Tongyi-MAI/Z-Image-Turbo',
          prompt: 'A simple red circle on white background',
          height: 512,
          width: 512,
          num_inference_steps: 9,
          guidance_scale: 0.0
        }),
      })

      if (!submitResponse.ok) {
        const error = await submitResponse.text()
        return NextResponse.json({ success: false, error: `Submit error: ${error}` })
      }

      const submitData = await submitResponse.json()
      const taskId = submitData.task_id

      if (!taskId) {
        return NextResponse.json({ success: false, error: 'No task_id', response: submitData })
      }

      // Step 2: Poll (max 15 seconds for test)
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const pollResponse = await fetch(`https://api-inference.modelscope.cn/v1/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-ModelScope-Task-Type': 'image_generation'
          }
        })

        if (pollResponse.ok) {
          const pollData = await pollResponse.json()
          if (pollData.status === 'SUCCEEDED' || pollData.status === 'completed') {
            return NextResponse.json({ 
              success: true, 
              provider: 'modelscope',
              model: model.name,
              taskId,
              response: pollData
            })
          } else if (pollData.status === 'FAILED') {
            return NextResponse.json({ success: false, error: 'Task failed', response: pollData })
          }
        }
      }

      return NextResponse.json({ success: false, error: 'Polling timeout', taskId })
    }

    return NextResponse.json({ success: false, error: `Image test not implemented for provider: ${model.provider}` })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
