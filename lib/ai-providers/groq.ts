import { AIProvider, AIResponse, GenerateTextOptions, AIProviderError } from './base'

/**
 * Groq AI Provider
 * Handles Llama model text generation via Groq's fast inference API
 */
export class GroqProvider implements AIProvider {
  name = 'Groq'
  type = 'groq' as const
  
  private apiKey: string
  private baseURL = 'https://api.groq.com/openai/v1'

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY!
    if (!this.apiKey) {
      throw new AIProviderError('GROQ_API_KEY environment variable not set', 'groq')
    }
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
          model: options?.model || 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.3,
        }),
      })

      if (!response.ok) {
        throw new AIProviderError(
          `Groq API error: ${response.statusText}`,
          'groq',
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
        provider: 'groq',
        tokens: data.usage?.total_tokens,
        finishReason: choice.finish_reason,
        metadata: { usage: data.usage }
      }
    } catch (error) {
      if (error instanceof AIProviderError) throw error
      throw new AIProviderError(
        `Groq request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'groq'
      )
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Groq API with key:', this.apiKey ? 'Key present' : 'No key')
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
      })
      
      console.log('Groq API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Groq API error response:', errorText)
        throw new Error(errorText)
      }
      
      console.log('Groq test successful')
      return true
    } catch (error) {
      console.error('Groq API test connection error:', error)
      throw error
    }
  }
}
