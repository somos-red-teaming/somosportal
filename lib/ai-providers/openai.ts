import { AIProvider, AIResponse, AIImageResponse, GenerateTextOptions, GenerateImageOptions, AIProviderError } from './base'

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI'
  type = 'openai' as const
  
  private apiKey: string
  private baseURL = 'https://api.openai.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

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
