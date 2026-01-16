import { AIProvider } from './base'
import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'
import { GoogleProvider } from './google'
import { CustomProvider } from './custom'
import { GroqProvider } from './groq'
import { HuggingFaceProvider } from './huggingface'

/**
 * Configuration interface for AI models
 */
export interface AIModelConfig {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'custom' | 'groq'
  model_id: string
  configuration: Record<string, any>
}

/**
 * Factory class for creating AI provider instances
 */
export class AIProviderFactory {
  /**
   * Create an AI provider instance based on configuration
   * @param config - AI model configuration
   * @returns AI provider instance
   */
  static createProvider(config: AIModelConfig): AIProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider()
      
      case 'anthropic':
        return new AnthropicProvider()
      
      case 'google':
        return new GoogleProvider()
      
      case 'custom':
        // Pass configuration from database to CustomProvider
        return new CustomProvider({
          endpoint: config.configuration?.endpoint,
          apiKeyEnv: config.configuration?.apiKeyEnv,
          modelId: config.model_id
        })
      
      case 'groq':
        return new GroqProvider()
      
      case 'huggingface':
        return new HuggingFaceProvider()
      
      default:
        throw new Error(`Unsupported provider: ${config.provider}`)
    }
  }

  /**
   * Test connection for an AI provider
   * @param config - AI model configuration
   * @returns Promise resolving to connection test result
   */
  static async testProvider(config: AIModelConfig): Promise<boolean> {
    try {
      const provider = this.createProvider(config)
      return await provider.testConnection()
    } catch {
      return false
    }
  }
}

/**
 * Manager class for handling multiple AI provider instances
 */
export class AIProviderManager {
  private providers = new Map<string, AIProvider>()

  /**
   * Load and register an AI model provider
   * @param config - AI model configuration
   */
  async loadModel(config: AIModelConfig): Promise<void> {
    const provider = AIProviderFactory.createProvider(config)
    this.providers.set(config.id, provider)
  }

  /**
   * Get a loaded AI provider by model ID
   * @param modelId - Model identifier
   * @returns AI provider instance or undefined
   */
  getProvider(modelId: string): AIProvider | undefined {
    return this.providers.get(modelId)
  }

  async generateText(modelId: string, prompt: string, options?: any) {
    const provider = this.getProvider(modelId)
    if (!provider) {
      throw new Error(`Model ${modelId} not loaded`)
    }
    return provider.generateText(prompt, options)
  }

  async generateImage(modelId: string, prompt: string, options?: any) {
    const provider = this.getProvider(modelId)
    if (!provider || !provider.generateImage) {
      throw new Error(`Model ${modelId} does not support image generation`)
    }
    return provider.generateImage(prompt, options)
  }

  async testModel(modelId: string): Promise<boolean> {
    const provider = this.getProvider(modelId)
    if (!provider) return false
    return provider.testConnection()
  }

  listLoadedModels(): string[] {
    return Array.from(this.providers.keys())
  }
}

/**
 * Global AI provider manager instance
 */
export const aiProviderManager = new AIProviderManager()
