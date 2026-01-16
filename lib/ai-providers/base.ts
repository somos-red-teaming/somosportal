/**
 * Base interface for all AI providers
 * Defines standard methods for text generation, image generation, and connection testing
 */
export interface AIProvider {
  name: string
  type: 'openai' | 'anthropic' | 'google' | 'custom' | 'groq' | 'huggingface'
  
  // Text generation
  generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResponse>
  
  // Image generation (optional)
  generateImage?(prompt: string, options?: GenerateImageOptions): Promise<AIImageResponse>
  
  // Test connection
  testConnection(): Promise<boolean>
}

/**
 * Options for text generation requests
 */
export interface GenerateTextOptions {
  maxTokens?: number
  temperature?: number
  model?: string
}

/**
 * Options for image generation requests
 */
export interface GenerateImageOptions {
  size?: string
  quality?: string
  style?: string
}

/**
 * Standard response format for AI text generation
 */
export interface AIResponse {
  id: string
  content: string
  model: string
  provider: string
  tokens?: number
  finishReason?: string
  metadata?: Record<string, any>
}

/**
 * Standard response format for AI image generation
 */
export interface AIImageResponse {
  id: string
  imageUrl: string
  model: string
  provider: string
  metadata?: Record<string, any>
}

/**
 * Custom error class for AI provider operations
 * Includes provider-specific error information
 */
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
