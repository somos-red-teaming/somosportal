// Base interface for all AI providers
export interface AIProvider {
  name: string
  type: 'openai' | 'anthropic' | 'google' | 'custom'
  
  // Text generation
  generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResponse>
  
  // Image generation (optional)
  generateImage?(prompt: string, options?: GenerateImageOptions): Promise<AIImageResponse>
  
  // Test connection
  testConnection(): Promise<boolean>
}

export interface GenerateTextOptions {
  maxTokens?: number
  temperature?: number
  model?: string
}

export interface GenerateImageOptions {
  size?: string
  quality?: string
  style?: string
}

export interface AIResponse {
  id: string
  content: string
  model: string
  provider: string
  tokens?: number
  finishReason?: string
  metadata?: Record<string, any>
}

export interface AIImageResponse {
  id: string
  imageUrl: string
  model: string
  provider: string
  metadata?: Record<string, any>
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}
