'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, User, Bot, Copy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface ChatBoxProps {
  modelName: string
  modelId: string
  exerciseId: string
  onSendMessage?: (message: string) => void
}

/**
 * Individual chatbox component for conversation with a single AI model
 * Optimized for both desktop and mobile with proper responsive design
 * @param modelName - Blind name of the model (Alpha, Beta, Gamma)
 * @param modelId - Internal model ID for API calls
 * @param exerciseId - Exercise ID for context
 * @param onSendMessage - Callback when user sends a message
 */
export function ChatBox({ modelName, modelId, exerciseId, onSendMessage }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  /**
   * Auto-scroll to bottom when new messages arrive - contained within chatbox
   */
  const scrollToBottom = () => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /**
   * Prevent page scroll when chatbox is being scrolled
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    const container = messagesContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const isAtTop = scrollTop === 0
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

    // Prevent page scroll when not at boundaries
    if (!isAtTop && !isAtBottom) {
      e.stopPropagation()
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation()
  }

  /**
   * Copy message content to clipboard
   */
  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  /**
   * Send message to AI model and update conversation
   */
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          modelId,
          prompt: userMessage.content,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: data.response.content,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          type: 'ai',
          content: "I'm currently unavailable. Please try again later or contact support if the issue persists.",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: "I'm currently unavailable. Please try again later or contact support if the issue persists.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }

    onSendMessage?.(userMessage.content)
  }

  /**
   * Handle Enter key press to send message - prevent page scroll
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      handleSendMessage()
    }
  }

  /**
   * Enhanced markdown components with proper overflow handling
   */
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''
      
      return !inline && language ? (
        <div className="relative my-2 -mx-3 max-w-full">
          <div className="overflow-x-auto bg-gray-900 rounded max-w-full">
            <div className="min-w-max">
              <SyntaxHighlighter
                style={oneDark}
                language={language}
                PreTag="div"
                className="!bg-transparent !m-0 text-xs"
                customStyle={{ 
                  margin: 0, 
                  padding: '12px',
                  fontSize: '0.75rem',
                  background: 'transparent',
                  whiteSpace: 'pre'
                }}
                wrapLongLines={false}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 h-6 w-6 p-0 bg-gray-800 hover:bg-gray-700 text-gray-300"
            onClick={() => copyToClipboard(String(children))}
            title="Copy code"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono break-all max-w-full inline-block" {...props}>
          {children}
        </code>
      )
    },
    // Tables with strict containment and horizontal scroll
    table({ children }: any) {
      return (
        <div className="overflow-x-auto my-2 -mx-3 max-w-full">
          <div className="min-w-max">
            <table className="border-collapse border border-gray-300 dark:border-gray-600 rounded text-xs">
              {children}
            </table>
          </div>
        </div>
      )
    },
    thead({ children }: any) {
      return <thead className="bg-gray-100 dark:bg-gray-700">{children}</thead>
    },
    th({ children }: any) {
      return (
        <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left font-semibold text-xs">
          {children}
        </th>
      )
    },
    td({ children }: any) {
      return (
        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs">
          {children}
        </td>
      )
    },
    p({ children }: any) {
      return <p className="mb-2 last:mb-0 break-words hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{children}</p>
    },
    ul({ children }: any) {
      return <ul className="list-disc list-inside mb-2 space-y-1 break-words">{children}</ul>
    },
    ol({ children }: any) {
      return <ol className="list-decimal list-inside mb-2 space-y-1 break-words">{children}</ol>
    },
    h1({ children }: any) {
      return <h1 className="text-lg font-bold mb-2 break-words hyphens-auto">{children}</h1>
    },
    h2({ children }: any) {
      return <h2 className="text-base font-bold mb-2 break-words hyphens-auto">{children}</h2>
    },
    h3({ children }: any) {
      return <h3 className="text-sm font-bold mb-1 break-words hyphens-auto">{children}</h3>
    },
    blockquote({ children }: any) {
      return <blockquote className="border-l-2 border-gray-300 pl-3 italic mb-2 break-words hyphens-auto">{children}</blockquote>
    },
    a({ href, children }: any) {
      return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline break-all">{children}</a>
    },
    pre({ children }: any) {
      return <div className="overflow-x-auto -mx-3">{children}</div>
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border shadow-sm w-full max-w-full min-w-0">
      {/* Header - Fixed size */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800 rounded-t-lg flex-shrink-0 min-h-[52px]">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate min-w-0">{modelName}</h3>
        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 ml-2"></div>
      </div>
      
      {/* Messages Area - Fixed height with internal scroll only */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 min-h-0 max-h-full overscroll-none w-full"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          contain: 'layout style paint'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Bot className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Chat with {modelName}</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                
                <div className={`max-w-[calc(100%-4rem)] sm:max-w-[85%] rounded-lg px-3 py-2 relative group min-w-0 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}>
                  <div className="text-sm min-w-0 max-w-full overflow-hidden">
                    {message.type === 'user' ? (
                      <p className="whitespace-pre-wrap break-words hyphens-auto min-w-0" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{message.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert min-w-0">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 pt-1">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-70 hover:opacity-100 hover:bg-white/20"
                      onClick={() => copyToClipboard(message.content)}
                      title="Copy message"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Fixed size at bottom */}
      <div className="border-t p-3 bg-gray-50 dark:bg-gray-800 rounded-b-lg flex-shrink-0 min-h-[80px]">
        <div className="flex gap-2 h-full" onKeyDown={(e) => e.stopPropagation()}>
          <Textarea
            placeholder={`Message ${modelName}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.stopPropagation()
              }
            }}
            rows={1}
            className="resize-none text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 min-h-[36px] max-h-[60px] flex-1 min-w-0"
            disabled={isLoading}
            style={{ fieldSizing: 'content' } as any}
          />
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSendMessage()
            }}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
            className="px-3 bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
