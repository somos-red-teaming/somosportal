'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })
import 'swagger-ui-react/swagger-ui.css'

interface AIModel {
  id: string
  name: string
  provider: string
}

const providerEmojis: Record<string, string> = {
  google: '🟢',
  groq: '🟣',
  openai: '🔵',
  anthropic: '🟠',
  custom: '⚪'
}

export default function ApiDocsPage() {
  const [models, setModels] = useState<AIModel[]>([])

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models')
      const data = await res.json()
      setModels(data.models || [])
    } catch (error) {
      console.error('Error fetching models:', error)
    }
  }

  // Generate OpenAPI spec with dynamic models
  const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SOMOS AI Red-Teaming Platform API',
    description: 'API endpoints for AI model integration and red-teaming exercises',
    version: '1.0.0',
    contact: {
      name: 'SOMOS Development Team'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    },
    {
      url: 'https://somos.website/api',
      description: 'Production server'
    }
  ],
  paths: {
    '/ai/chat': {
      post: {
        summary: 'Generate AI response',
        description: 'Generate text response from specified AI model for red-teaming exercise',
        tags: ['AI Integration'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['exerciseId', 'modelId', 'prompt'],
                properties: {
                  exerciseId: {
                    type: 'string',
                    description: 'Unique identifier for the exercise',
                    example: 'test-exercise-123'
                  },
                  modelId: {
                    type: 'string',
                    description: 'Select AI model to use',
                    enum: models.map(m => m.id),
                    'x-enumNames': models.map(m => `${providerEmojis[m.provider] || '⚪'} ${m.name}`),
                    default: models[0]?.id || ''
                  },
                  prompt: {
                    type: 'string',
                    description: 'User prompt to send to AI model',
                    example: 'Hello, how are you?'
                  },
                  conversationId: {
                    type: 'string',
                    description: 'Optional conversation ID for threading',
                    example: 'conv-1766164317213'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successful AI response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    response: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                          description: 'Unique response ID',
                          example: 'gemini-1766164317213'
                        },
                        content: {
                          type: 'string',
                          description: 'AI-generated response text',
                          example: "Hello! As an AI, I don't have feelings..."
                        },
                        model: {
                          type: 'string',
                          description: 'Model identifier used',
                          example: 'gemini-2.5-flash'
                        },
                        provider: {
                          type: 'string',
                          enum: ['google', 'groq', 'openai', 'anthropic', 'custom'],
                          description: 'AI provider used',
                          example: 'google'
                        },
                        tokens: {
                          type: 'integer',
                          description: 'Number of tokens used',
                          example: 232
                        },
                        conversationId: {
                          type: 'string',
                          description: 'Conversation thread ID',
                          example: 'conv-1766164317213'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request - missing required fields',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'Missing required fields: exerciseId, modelId, prompt'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/ai/test': {
      post: {
        summary: 'Test AI model connection',
        description: 'Test connection to specified AI model and verify API credentials',
        tags: ['AI Integration'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['modelId'],
                properties: {
                  modelId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'UUID of the AI model to test',
                    example: '4c47fde5-4acd-4db2-b93d-8b3180fde744'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Test result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      description: 'Whether the connection test succeeded',
                      example: true
                    },
                    error: {
                      type: 'string',
                      description: 'Error message if test failed',
                      example: 'Your credit balance is too low to access the Anthropic API'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'AI Integration',
      description: 'AI model integration and chat endpoints'
    }
  ]
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
            <p className="text-muted-foreground mb-4">
              Interactive documentation for SOMOS AI Red-Teaming Platform APIs
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-black mb-3">Available AI Models for Testing:</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                {models.map((model) => (
                  <div key={model.id} className="bg-white rounded-lg p-3 border border-blue-100">
                    <h4 className="font-semibold mb-2 text-black">
                      {providerEmojis[model.provider] || '⚪'} {model.name}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">Provider: {model.provider}</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-black">{model.id}</code>
                    <div className="mt-2 text-xs text-green-600">✅ Active</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-blue-200">
                <h4 className="font-semibold text-gray-700 mb-2">🔄 Coming Soon:</h4>
                <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>🔸 OpenAI GPT-4o (requires credits)</div>
                  <div>🔸 Anthropic Claude 3.5 (requires credits)</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm">
            <SwaggerUI spec={openApiSpec} />
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}
