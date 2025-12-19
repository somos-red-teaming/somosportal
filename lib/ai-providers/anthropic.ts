import { AIProvider, AIResponse, GenerateTextOptions, AIProviderError } from './base'

export class AnthropicProvider implements AIProvider {
  name = 'Anthropic'
  type = 'anthropic' as const
  
  private apiKey: string
  private baseURL = 'https://api.anthropic.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
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
      // Test with a minimal request
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      })
      return response.ok
    } catch {
      return false
    }
  }
}
