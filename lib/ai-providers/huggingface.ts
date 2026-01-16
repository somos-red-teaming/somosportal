import { AIProvider, AIResponse } from './base'

/**
 * Hugging Face provider for image generation models
 */
export class HuggingFaceProvider implements AIProvider {
  name = 'HuggingFace'
  type: 'huggingface' = 'huggingface'
  private apiKey: string

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || ''
  }

  async generateText(prompt: string): Promise<AIResponse> {
    // HuggingFace models in SOMOS are image-only
    return {
      content: 'This model only supports image generation.',
      model: 'huggingface'
    }
  }

  async testConnection(): Promise<boolean> {
    // Just verify API key exists - actual test would require model-specific call
    return !!this.apiKey
  }
}
