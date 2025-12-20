import { AIProvider, AIResponse, AIImageResponse, GenerateTextOptions, GenerateImageOptions, AIProviderError } from './base'

/**
 * Google AI Provider
 * Handles Gemini model text generation
 */
export class GoogleProvider implements AIProvider {
  name = 'Google'
  type = 'google' as const
  
  private apiKey: string
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta'

  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY!
    if (!this.apiKey) {
      throw new AIProviderError('GOOGLE_API_KEY environment variable not set', 'google')
    }
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResponse> {
    try {
      const model = options?.model || 'gemini-pro'
      const response = await fetch(`${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            maxOutputTokens: options?.maxTokens || 1000,
            temperature: options?.temperature || 0.7,
          }
        }),
      })

      if (!response.ok) {
        throw new AIProviderError(
          `Google Gemini API error: ${response.statusText}`,
          'google',
          response.status.toString(),
          response.status
        )
      }

      const data = await response.json()
      const candidate = data.candidates[0]
      const content = candidate.content.parts[0].text

      return {
        id: `gemini-${Date.now()}`,
        content,
        model,
        provider: 'google',
        tokens: data.usageMetadata?.totalTokenCount,
        finishReason: candidate.finishReason,
        metadata: { 
          usageMetadata: data.usageMetadata,
          safetyRatings: candidate.safetyRatings 
        }
      }
    } catch (error) {
      if (error instanceof AIProviderError) throw error
      throw new AIProviderError(
        `Google Gemini request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'google'
      )
    }
  }

  async generateImage(prompt: string, options?: GenerateImageOptions): Promise<AIImageResponse> {
    try {
      // Nano Banana 🍌 - Using Gemini Pro Vision for image generation
      const response = await fetch(`${this.baseURL}/models/gemini-pro-vision:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ 
              text: `Generate an image: ${prompt}. Style: ${options?.style || 'photorealistic'}. Quality: ${options?.quality || 'high'}.`
            }]
          }],
          generationConfig: {
            maxOutputTokens: 1000,
          }
        }),
      })

      if (!response.ok) {
        throw new AIProviderError(
          `Nano Banana (Google Vision) API error: ${response.statusText}`,
          'google',
          response.status.toString(),
          response.status
        )
      }

      const data = await response.json()
      
      // Note: This is a placeholder implementation
      // Real Nano Banana would return actual image data
      // For now, we'll return a placeholder response
      return {
        id: `nano-banana-${Date.now()}`,
        imageUrl: '/placeholder-nano-banana.jpg', // Placeholder
        model: 'gemini-pro-vision',
        provider: 'google',
        metadata: { 
          prompt,
          style: options?.style,
          note: 'Nano Banana 🍌 - Placeholder implementation'
        }
      }
    } catch (error) {
      if (error instanceof AIProviderError) throw error
      throw new AIProviderError(
        `Nano Banana request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'google'
      )
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Google API with key:', this.apiKey ? 'Key present' : 'No key')
      
      // Use gemini-2.5-flash which should be available
      const testModel = 'gemini-2.5-flash'
      console.log('Testing with model:', testModel)
      
      const response = await fetch(`${this.baseURL}/models/${testModel}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Hi' }]
          }],
          generationConfig: {
            maxOutputTokens: 1,
          }
        }),
      })
      
      console.log('Google API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Google API error response:', errorText)
      }
      
      return response.ok
    } catch (error) {
      console.error('Google API test connection error:', error)
      return false
    }
  }
}
