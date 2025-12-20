import { AIProvider, AIResponse, AIImageResponse, GenerateTextOptions, GenerateImageOptions, AIProviderError } from './base'

/**
 * OpenAI AI Provider
 * Handles GPT-4 text generation and DALL-E 3 image generation
 */
export class OpenAIProvider implements AIProvider {
  name = 'OpenAI'
  type = 'openai' as const
  
  private apiKey: string
  private baseURL = 'https://api.openai.com/v1'

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY!
    if (!this.apiKey) {
      throw new AIProviderError('OPENAI_API_KEY environment variable not set', 'openai')
    }
  }

  /**
   * Generates text response using OpenAI GPT models
   * @param prompt - User input prompt
   * @param options - Generation options (model, maxTokens, temperature)
   * @returns Promise<AIResponse> - Generated text response with metadata
   */
  async generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options?.model || 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.7,
        }),
      })

      if (!response.ok) {
        throw new AIProviderError(
          `OpenAI API error: ${response.statusText}`,
          'openai',
          response.status.toString(),
          response.status
        )
      }

      const data = await response.json()
      const choice = data.choices[0]

      return {
        id: data.id,
        content: choice.message.content,
        model: data.model,
        provider: 'openai',
        tokens: data.usage?.total_tokens,
        finishReason: choice.finish_reason,
        metadata: { usage: data.usage }
      }
    } catch (error) {
      if (error instanceof AIProviderError) throw error
      throw new AIProviderError(
        `OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openai'
      )
    }
  }

  /**
   * Generates images using DALL-E 3
   * @param prompt - Image description prompt
   * @param options - Image generation options (size, quality)
   * @returns Promise<AIImageResponse> - Generated image URL with metadata
   */
  async generateImage(prompt: string, options?: GenerateImageOptions): Promise<AIImageResponse> {
    try {
      const response = await fetch(`${this.baseURL}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          size: options?.size || '1024x1024',
          quality: options?.quality || 'standard',
          n: 1,
        }),
      })

      if (!response.ok) {
        throw new AIProviderError(
          `OpenAI DALL-E API error: ${response.statusText}`,
          'openai',
          response.status.toString(),
          response.status
        )
      }

      const data = await response.json()
      const image = data.data[0]

      return {
        id: `dalle-${Date.now()}`,
        imageUrl: image.url,
        model: 'dall-e-3',
        provider: 'openai',
        metadata: { revised_prompt: image.revised_prompt }
      }
    } catch (error) {
      if (error instanceof AIProviderError) throw error
      throw new AIProviderError(
        `OpenAI DALL-E request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openai'
      )
    }
  }

  /**
   * Tests connection to OpenAI API
   * @returns Promise<boolean> - True if connection successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
