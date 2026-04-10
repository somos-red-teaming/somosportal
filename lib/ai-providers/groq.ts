import { AIProvider, AIResponse, GenerateTextOptions, AIProviderError } from './base'

/**
 * Groq AI Provider
 * Handles Llama model text generation via Groq's fast inference API
 * Supports automatic fallback to alternative models on quota exhaustion or errors
 */
export class GroqProvider implements AIProvider {
  name = 'Groq'
  type = 'groq' as const
  
  private apiKey: string
  private baseURL = 'https://api.groq.com/openai/v1'
  private fallbackModels: string[] = [
    'llama-3.1-8b-instant',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'allam-2-7b',
  ]

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY!
    if (!this.apiKey) {
      throw new AIProviderError('GROQ_API_KEY environment variable not set', 'groq')
    }
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResponse> {
    const primaryModel = options?.model || 'llama-3.3-70b-versatile'
    const modelsToTry = [primaryModel, ...this.fallbackModels.filter(m => m !== primaryModel)]
    
    let lastError: Error | null = null

    for (const model of modelsToTry) {
      try {
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options?.maxTokens || 1000,
            temperature: options?.temperature || 0.3,
          }),
        })

        // If rate limited (429), payload too large (413), or server error (5xx), try next model
        if (response.status === 429 || response.status === 413 || response.status >= 500) {
          lastError = new Error(`${model}: ${response.status}`)
          continue
        }

        if (!response.ok) {
          throw new AIProviderError(
            `Groq API error: ${response.statusText}`,
            'groq',
            response.status.toString(),
            response.status
          )
        }

        const data = await response.json()
        
        // Guard against empty or malformed response
        if (!Array.isArray(data.choices) || !data.choices.length) {
          lastError = new Error(`${model}: Empty choices array`)
          continue
        }

        const choice = data.choices[0]
        if (!choice.message?.content) {
          lastError = new Error(`${model}: No message content`)
          continue
        }

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
        lastError = error instanceof Error ? error : new Error('Unknown error')
        // Continue to next model
      }
    }

    // All models exhausted
    throw new AIProviderError(
      `All Groq models exhausted: ${lastError?.message || 'Unknown error'}`,
      'groq'
    )
  }

  async testConnection(modelId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId || 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new AIProviderError(
          `Groq API error: ${response.statusText}`,
          'groq',
          errorText,
          response.status
        )
      }
      
      const data = await response.json()
      if (!Array.isArray(data.choices) || !data.choices.length) {
        throw new AIProviderError(
          'Groq API returned empty choices',
          'groq'
        )
      }
      
      return true
    } catch (error) {
      if (error instanceof AIProviderError) throw error
      throw new AIProviderError(
        `Groq test connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'groq'
      )
    }
  }
}
