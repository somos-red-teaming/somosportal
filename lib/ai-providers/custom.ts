import { AIProvider, AIResponse, AIImageResponse, GenerateTextOptions, GenerateImageOptions, AIProviderError } from './base'

/**
 * Custom AI Provider
 * Supports multiple custom models via database configuration
 * API keys stored securely in env vars, referenced by name in DB
 */
export class CustomProvider implements AIProvider {
  name = 'Custom'
  type = 'custom' as const
  
  private apiKey?: string
  private endpoint: string
  private headers: Record<string, string>
  private modelId: string

  /**
   * Create a custom provider instance
   * @param config - Configuration from database (endpoint, apiKeyEnv)
   */
  constructor(config?: { endpoint?: string; apiKeyEnv?: string; modelId?: string }) {
    this.endpoint = config?.endpoint || process.env.CUSTOM_ENDPOINT || ''
    this.modelId = config?.modelId || 'default'
    
    if (!this.endpoint) {
      throw new AIProviderError('Custom endpoint not configured', 'custom')
    }
    
    // Get API key from env var name stored in DB
    if (config?.apiKeyEnv) {
      this.apiKey = process.env[config.apiKeyEnv]
      if (!this.apiKey) {
        throw new AIProviderError(`Environment variable ${config.apiKeyEnv} not set`, 'custom')
      }
    } else {
      this.apiKey = process.env.CUSTOM_API_KEY
    }
    
    this.headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
    }
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: options?.model || 'default',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.7,
        }),
      })

      if (!response.ok) {
        throw new AIProviderError(
          `Custom API error: ${response.statusText}`,
          'custom',
          response.status.toString(),
          response.status
        )
      }

      const data = await response.json()
      
      // Handle different response formats
      let content: string
      let model: string
      let tokens: number | undefined

      if (data.choices && data.choices[0]) {
        // OpenAI-compatible format
        content = data.choices[0].message?.content || data.choices[0].text
        model = data.model || 'custom-model'
        tokens = data.usage?.total_tokens
      } else if (data.response) {
        // Simple response format
        content = data.response
        model = data.model || 'custom-model'
        tokens = data.tokens
      } else {
        throw new AIProviderError('Unexpected response format from custom API', 'custom')
      }

      return {
        id: data.id || `custom-${Date.now()}`,
        content,
        model,
        provider: 'custom',
        tokens,
        finishReason: data.finish_reason || 'stop',
        metadata: { endpoint: this.endpoint }
      }
    } catch (error) {
      if (error instanceof AIProviderError) throw error
      throw new AIProviderError(
        `Custom API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'custom'
      )
    }
  }

  async generateImage(prompt: string, options?: GenerateImageOptions): Promise<AIImageResponse> {
    try {
      const response = await fetch(`${this.endpoint}/images/generations`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          prompt,
          size: options?.size || '1024x1024',
          quality: options?.quality || 'standard',
        }),
      })

      if (!response.ok) {
        throw new AIProviderError(
          `Custom Image API error: ${response.statusText}`,
          'custom',
          response.status.toString(),
          response.status
        )
      }

      const data = await response.json()
      
      // Handle different response formats
      let imageUrl: string
      if (data.data && data.data[0]) {
        imageUrl = data.data[0].url
      } else if (data.image_url) {
        imageUrl = data.image_url
      } else {
        throw new AIProviderError('No image URL in custom API response', 'custom')
      }

      return {
        id: data.id || `custom-img-${Date.now()}`,
        imageUrl,
        model: data.model || 'custom-image-model',
        provider: 'custom',
        metadata: { endpoint: this.endpoint }
      }
    } catch (error) {
      if (error instanceof AIProviderError) throw error
      throw new AIProviderError(
        `Custom Image API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'custom'
      )
    }
  }

  /**
   * Test connection to custom API endpoint
   * Uses the configured model ID for the test request
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try a minimal chat request with the actual model ID
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: this.modelId,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
      })
      
      return response.ok
    } catch {
      return false
    }
  }
}
