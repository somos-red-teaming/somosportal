import { AIProvider, AIResponse, GenerateTextOptions, AIProviderError } from './base'

/**
 * Anthropic AI Provider
 * Handles Claude model text generation
 */
export class AnthropicProvider implements AIProvider {
  name = 'Anthropic'
  type = 'anthropic' as const
  
  private apiKey: string
  private baseURL = 'https://api.anthropic.com/v1'

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY!
    if (!this.apiKey) {
      throw new AIProviderError('ANTHROPIC_API_KEY environment variable not set', 'anthropic')
    }
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: options?.model || 'claude-3-sonnet-20240229',
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.7,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        throw new AIProviderError(
          `Anthropic API error: ${response.statusText}`,
          'anthropic',
          response.status.toString(),
          response.status
        )
      }

      const data = await response.json()
      const content = data.content[0]

      return {
        id: data.id,
        content: content.text,
        model: data.model,
        provider: 'anthropic',
        tokens: data.usage?.output_tokens,
        finishReason: data.stop_reason,
        metadata: { usage: data.usage }
      }
    } catch (error) {
      if (error instanceof AIProviderError) throw error
      throw new AIProviderError(
        `Anthropic request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'anthropic'
      )
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Anthropic API with key:', this.apiKey ? 'Key present' : 'No key')
      
      // Test with current model
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      })
      
      console.log('Anthropic API response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Anthropic API error response:', JSON.stringify(errorData))
        
        // Extract the actual error message
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }
      
      console.log('Anthropic test successful')
      return true
    } catch (error) {
      console.error('Anthropic API test connection error:', error)
      throw error // Re-throw so the API can catch and return the actual error
    }
  }
}
