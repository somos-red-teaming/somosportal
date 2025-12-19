import { AIProvider } from './base'
import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'
import { GoogleProvider } from './google'
import { CustomProvider } from './custom'

export interface AIModelConfig {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'custom'
  model_id: string
  configuration: Record<string, any>
}

export class AIProviderFactory {
  static createProvider(config: AIModelConfig): AIProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config.configuration.apiKey)
      
      case 'anthropic':
        return new AnthropicProvider(config.configuration.apiKey)
      
      case 'google':
        return new GoogleProvider(config.configuration.apiKey)
      
      case 'custom':
        return new CustomProvider({
          endpoint: config.configuration.endpoint,
          apiKey: config.configuration.apiKey,
          headers: config.configuration.headers
        })
      
      default:
        throw new Error(`Unsupported provider: ${config.provider}`)
    }
  }

  static async testProvider(config: AIModelConfig): Promise<boolean> {
    try {
      const provider = this.createProvider(config)
      return await provider.testConnection()
    } catch {
      return false
    }
  }
}

// Provider manager for handling multiple models
export class AIProviderManager {
  private providers = new Map<string, AIProvider>()

  async loadModel(config: AIModelConfig): Promise<void> {
    const provider = AIProviderFactory.createProvider(config)
    this.providers.set(config.id, provider)
  }

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

// Global instance
export const aiProviderManager = new AIProviderManager()
