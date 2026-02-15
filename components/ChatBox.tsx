'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, User, Bot, Copy, Image, Flag, Settings2, X } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TimerDisplay } from './TimerDisplay'

import { supabase } from '@/lib/supabase'

// Component to load images from private storage with signed URL
function ImageFromStorage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.storage.from(path.split('/')[0]).createSignedUrl(path.split('/').slice(1).join('/'), 3600)
      if (data?.signedUrl) setUrl(data.signedUrl)
    }
    load()
  }, [path])
  if (!url) return <div className="text-muted-foreground">Loading image...</div>
  return <img src={url} alt="Generated" className="max-w-md rounded" />
}

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  imageUrl?: string // Add optional image URL for image messages
}

interface ChatBoxProps {
  modelName: string
  modelId: string
  exerciseId: string
  userId?: string
  onSendMessage?: (message: string) => void
  onCreditsUpdate?: (credits: number) => void
  timerEnabled?: boolean
  isTimerExpired?: boolean
  participantId?: string
  initialTimeRemaining?: number
  onTimerExpire?: () => void
  initialHistory?: any[]
}

const defaultFlagCategories = [
  { value: 'harmful_content', label: 'Harmful Content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'bias_discrimination', label: 'Bias & Discrimination' },
  { value: 'privacy_violation', label: 'Privacy Violation' },
  { value: 'inappropriate_response', label: 'Inappropriate Response' },
  { value: 'factual_error', label: 'Factual Error' },
  { value: 'off_topic', label: 'Off Topic' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' }
]

/**
 * Individual chatbox component for conversation with a single AI model
 * Optimized for both desktop and mobile with proper responsive design
 * @param modelName - Blind name of the model (Alpha, Beta, Gamma)
 * @param modelId - Internal model ID for API calls
 * @param exerciseId - Exercise ID for context
 * @param onSendMessage - Callback when user sends a message
 */
export function ChatBox({ modelName, modelId, exerciseId, userId, onSendMessage, onCreditsUpdate, timerEnabled, isTimerExpired, participantId, initialTimeRemaining, onTimerExpire, initialHistory }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // Session ID for grouping conversation
  const [sessionId] = useState(() => crypto.randomUUID())

  // Tool mode state (for image generation)
  const [isExpired, setIsExpired] = useState(isTimerExpired || false)
  
  // Update expired state when prop changes
  useEffect(() => {
    if (isTimerExpired) {
      setIsExpired(true)
    }
  }, [isTimerExpired])
  const [imageMode, setImageMode] = useState(false)

  // Flag categories (loaded from exercise package or default)
  const [flagCategoryOptions, setFlagCategoryOptions] = useState(defaultFlagCategories)

  // Load initial history from props
  useEffect(() => {
    console.log('ChatBox initialHistory:', initialHistory)
    if (initialHistory && initialHistory.length > 0) {
      const history: Message[] = []
      initialHistory.forEach((interaction: any) => {
        history.push({
          id: `${interaction.id}-user`,
          type: 'user',
          content: interaction.prompt,
          timestamp: new Date(interaction.created_at)
        })
        if (interaction.response) {
          if (interaction.response.startsWith('storage:')) {
            history.push({
              id: `${interaction.id}-ai`,
              type: 'ai',
              content: '',
              timestamp: new Date(interaction.created_at),
              imageUrl: interaction.response.replace('storage:', '')
            })
          } else {
            history.push({
              id: `${interaction.id}-ai`,
              type: 'ai',
              content: interaction.response,
              timestamp: new Date(interaction.created_at)
            })
          }
        }
      })
      console.log('Setting messages:', history)
      setMessages(history)
    }
  }, [])

  // Update expired state when timer expires
  useEffect(() => {
    if (timerEnabled && initialTimeRemaining !== undefined && initialTimeRemaining <= 0) {
      setIsExpired(true)
    }
  }, [timerEnabled, initialTimeRemaining])

  // Flagging state
  const [flagCategories, setFlagCategories] = useState<string[]>([]) // Changed to array for multiple selection
  const [severity, setSeverity] = useState([5])
  const [flagComment, setFlagComment] = useState('')
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false)
  const [flagDialogOpen, setFlagDialogOpen] = useState(false)

  // Image viewer state
  const [viewerImage, setViewerImage] = useState<string | null>(null)

  // Load flag categories for this exercise
  useEffect(() => {
    const loadFlagCategories = async () => {
      const { data: exercise } = await import('@/lib/supabase').then(m => 
        m.supabase.from('exercises').select('flag_package_id').eq('id', exerciseId).single()
      )
      if (exercise?.flag_package_id) {
        const { data: categories } = await import('@/lib/supabase').then(m =>
          m.supabase.from('flag_categories').select('value, label').eq('package_id', exercise.flag_package_id).order('sort_order')
        )
        if (categories?.length) {
          setFlagCategoryOptions(categories)
        }
      }
    }
    loadFlagCategories()
  }, [exerciseId])

  // Timer update handler
  const handleTimerUpdate = useCallback(async (elapsedSeconds: number) => {
    // Don't update if expired or no participant
    if (!participantId || isExpired) return
    
    try {
      const res = await fetch('/api/exercises/timer/update', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, elapsedSeconds })
      })
      
      if (!res.ok) {
        const error = await res.json()
        // Don't log if exercise is already completed - this is expected during cleanup
        if (error.expired || error.completed) {
          return
        }
        console.error('Timer update failed:', error)
      }
    } catch (error) {
      console.error('Failed to update timer:', error)
    }
  }, [participantId, isExpired])

  const handleTimerExpireInternal = () => {
    setIsExpired(true)
    onTimerExpire?.()
  }



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
   * Handle flag submission for this conversation
   */
  const handleSubmitFlag = async () => {
    if (flagCategories.length === 0 || !flagComment.trim() || isSubmittingFlag) return

    setIsSubmittingFlag(true)

    try {
      const response = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          modelId,
          categories: flagCategories,
          severity: severity[0],
          comment: flagComment,
          messages: messages,
          userId // Pass userId to API
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Reset form and close dialog
        setFlagCategories([])
        setSeverity([5])
        setFlagComment('')
        setFlagDialogOpen(false)
        
        // Show success message
        const selectedLabels = flagCategories.map(cat => 
          flagCategoryOptions.find(c => c.value === cat)?.label
        ).join(', ')
        alert(`Flag submitted for ${modelName}!\nCategories: ${selectedLabels}\nSeverity: ${severity[0]}/10\n\nThank you for helping improve AI safety!`)
      } else {
        alert('Failed to submit flag: ' + (data.error || 'Unknown error'))
      }

    } catch (error) {
      console.error('Error submitting flag:', error)
      alert('Failed to submit flag. Please try again.')
    } finally {
      setIsSubmittingFlag(false)
    }
  }

  /**
   * Handle image generation request
   */
  const handleGenerateImage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const prompt = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message for image request
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: `🖼️ Generate image: ${prompt}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          modelId,
          blindName: modelName,
          exerciseId,
          userId,
          conversationId: sessionId,
        }),
      })

      const data = await response.json()

      if (data.imageUrl) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: `Generated image for: "${prompt}"`,
          timestamp: new Date(),
          imageUrl: data.imageUrl
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          type: 'ai',
          content: "I'm currently unable to generate images. Please try again later.",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error generating image:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: "I'm currently unable to generate images. Please try again later.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }

    onSendMessage?.(prompt)
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
          userId,
          conversationId: sessionId,
          history: messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }))
        }),
      })

      const data = await response.json()

      if (response.status === 402) {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          type: 'ai',
          content: `Insufficient credits. You need ${data.creditsRequired} credits but have ${data.creditsAvailable}. Contact an admin for more credits.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      } else if (data.success) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: data.response.content,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
        if (data.creditsRemaining !== null && data.creditsRemaining !== undefined) {
          onCreditsUpdate?.(data.creditsRemaining)
        }
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
      setTimeout(() => inputRef.current?.focus(), 100)
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
      if (imageMode) {
        handleGenerateImage()
      } else {
        handleSendMessage()
      }
    }
  }

  /**
   * Enhanced markdown components with proper overflow handling for mobile
   */
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')

      return !inline ? (
        <div className="relative my-2 w-full overflow-hidden">
          <div className="overflow-x-auto bg-gray-900 rounded w-full">
            <pre className="p-2 text-[11px] sm:text-xs text-white font-mono overflow-x-auto">
              <code {...props}>{children}</code>
            </pre>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-1 right-1 h-5 w-5 p-0 bg-gray-800 hover:bg-gray-700 text-gray-300"
            onClick={() => copyToClipboard(String(children))}
            title="Copy code"
          >
            <Copy className="h-2.5 w-2.5" />
          </Button>
        </div>
      ) : (
        <code
          className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px] sm:text-xs font-mono break-all max-w-full inline-block"
          {...props}
        >
          {children}
        </code>
      )
    },
    table({ children }: any) {
      return (
        <div className="overflow-x-auto my-2 w-full">
          <table className="border-collapse border border-gray-300 dark:border-gray-600 rounded text-[10px] sm:text-xs min-w-full">
            {children}
          </table>
        </div>
      )
    },
    thead({ children }: any) {
      return <thead className="bg-gray-100 dark:bg-gray-700">{children}</thead>
    },
    th({ children }: any) {
      return (
        <th className="border border-gray-300 dark:border-gray-600 px-1.5 sm:px-2 py-1 text-left font-semibold text-[10px] sm:text-xs whitespace-nowrap">
          {children}
        </th>
      )
    },
    td({ children }: any) {
      return (
        <td className="border border-gray-300 dark:border-gray-600 px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs whitespace-nowrap">
          {children}
        </td>
      )
    },
    p({ children }: any) {
      return (
        <p
          className="mb-2 last:mb-0 break-words hyphens-auto leading-relaxed"
          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
        >
          {children}
        </p>
      )
    },
    ul({ children }: any) {
      return <ul className="list-disc list-inside mb-2 space-y-1 break-words">{children}</ul>
    },
    ol({ children }: any) {
      return <ol className="list-decimal list-inside mb-2 space-y-1 break-words">{children}</ol>
    },
    h1({ children }: any) {
      return <h1 className="text-base sm:text-lg font-bold mb-2 break-words hyphens-auto">{children}</h1>
    },
    h2({ children }: any) {
      return <h2 className="text-sm sm:text-base font-bold mb-2 break-words hyphens-auto">{children}</h2>
    },
    h3({ children }: any) {
      return <h3 className="text-xs sm:text-sm font-bold mb-1 break-words hyphens-auto">{children}</h3>
    },
    blockquote({ children }: any) {
      return (
        <blockquote className="border-l-2 border-gray-300 pl-2 sm:pl-3 italic mb-2 break-words hyphens-auto text-xs sm:text-sm">
          {children}
        </blockquote>
      )
    },
    a({ href, children }: any) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline break-all text-xs sm:text-sm"
        >
          {children}
        </a>
      )
    },
    pre({ children }: any) {
      return <div className="overflow-x-auto w-full">{children}</div>
    },
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border shadow-sm w-full max-w-full min-w-0 overflow-hidden">
      {/* Header - Fixed size with mobile optimizations */}
      <div className="flex items-center justify-between p-2 sm:p-3 border-b bg-gray-50 dark:bg-gray-800 rounded-t-lg flex-shrink-0 min-h-[44px] sm:min-h-[52px]">
        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate min-w-0">
          {modelName}
        </h3>
        <div className="flex items-center gap-2">
          {timerEnabled && participantId && initialTimeRemaining !== undefined && (
            <TimerDisplay
              participantId={participantId}
              initialTimeRemaining={initialTimeRemaining}
              isExpired={isExpired}
              onExpire={handleTimerExpireInternal}
              onUpdate={handleTimerUpdate}
            />
          )}
          <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 sm:px-3 flex-shrink-0 gap-1 cursor-pointer text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                title="This flags a potential harm for the exercise's findings and is shared with facilitators. This is not a formal platform report."
              >
                <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs">Flag Harm</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Flag a Harm - {modelName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Categories (select multiple)</Label>
                  <ScrollArea className="h-[180px] rounded-md border p-2 mt-1">
                    {flagCategoryOptions.map((cat) => (
                      <div 
                        key={cat.value} 
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                          flagCategories.includes(cat.value) ? 'bg-primary/10' : 'hover:bg-accent'
                        }`} 
                        onClick={() => {
                          if (flagCategories.includes(cat.value)) {
                            setFlagCategories(flagCategories.filter(c => c !== cat.value))
                          } else {
                            setFlagCategories([...flagCategories, cat.value])
                          }
                        }}
                      >
                        <Checkbox checked={flagCategories.includes(cat.value)} />
                        <span className="text-sm">{cat.label}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                <div>
                  <Label>Severity (1-10)</Label>
                  <div className="px-2 mt-2">
                    <Slider
                      value={severity}
                      onValueChange={setSeverity}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1 (Minor)</span>
                      <span className="font-medium">{severity[0]}</span>
                      <span>10 (Severe)</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Comment</Label>
                  <Textarea 
                    placeholder="Describe the issue with this conversation..." 
                    value={flagComment} 
                    onChange={(e) => setFlagComment(e.target.value)} 
                    rows={3} 
                    className="mt-1" 
                  />
                </div>
                <Button 
                  onClick={handleSubmitFlag} 
                  className="w-full" 
                  disabled={flagCategories.length === 0 || !flagComment.trim() || isSubmittingFlag}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  {isSubmittingFlag ? 'Submitting...' : 'Submit Flag'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
        </div>
      </div>

      {/* Messages Area - Fixed height with internal scroll only, strict containment */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 space-y-2 sm:space-y-3 min-h-0 max-h-full w-full"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          contain: 'strict',
          overscrollBehavior: 'contain',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Bot className="h-6 w-6 sm:h-8 sm:w-8 mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">Chat with {modelName}</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-1.5 sm:gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                )}

                <div
                  className={`max-w-[calc(100%-3rem)] sm:max-w-[80%] rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 relative group min-w-0 overflow-hidden ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="text-xs sm:text-sm min-w-0 max-w-full overflow-hidden">
                    {message.type === 'user' ? (
                      <p
                        className="whitespace-pre-wrap break-words hyphens-auto min-w-0 leading-relaxed"
                        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                      >
                        {message.content}
                      </p>
                    ) : (
                      <>
                        <div className="prose prose-sm max-w-none dark:prose-invert min-w-0 overflow-hidden">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        {/* Display image if present */}
                        {message.imageUrl && (
                          <div className="mt-2">
                            <ImageFromStorage path={message.imageUrl} />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-1">
                    <span className="text-[10px] sm:text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-70 hover:opacity-100 hover:bg-white/20"
                      onClick={() => copyToClipboard(message.content)}
                      title="Copy message"
                    >
                      <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-1.5 sm:gap-2 justify-start">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <div
                      className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Fixed size at bottom with mobile optimizations */}
      <div className="border-t p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-b-lg flex-shrink-0 min-h-[60px] sm:min-h-[80px]">
        <div className="flex gap-1.5 sm:gap-2 h-full" onKeyDown={(e) => e.stopPropagation()}>
          <Textarea
            ref={inputRef}
            placeholder={isExpired ? "Time expired - Exercise completed" : `Message ${modelName}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.stopPropagation()
              }
            }}
            rows={1}
            className="resize-none text-xs sm:text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 min-h-[32px] sm:min-h-[36px] max-h-[48px] sm:max-h-[60px] flex-1 min-w-0"
            disabled={isLoading || isExpired}
            style={{ fieldSizing: 'content' } as any}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="px-2 flex-shrink-0 h-8 sm:h-9 gap-1"
              >
                <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs hidden sm:inline">Tools</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setImageMode(!imageMode)}>
                <Image className="h-4 w-4 mr-2" />
                Create image
                {imageMode && <span className="ml-2 text-primary">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {imageMode && (
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs text-primary">
              <Image className="h-3 w-3" />
              <span>Image</span>
              <button onClick={() => setImageMode(false)} className="ml-1 hover:bg-primary/20 rounded">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (imageMode) {
                handleGenerateImage()
              } else {
                handleSendMessage()
              }
            }}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
            className="px-2 sm:px-3 bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0 h-8 sm:h-9"
          >
            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewerImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewerImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={viewerImage} 
              alt="Full size" 
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <a
                href={viewerImage}
                download={`image-${Date.now()}.png`}
                className="p-2 bg-white/90 hover:bg-white rounded-full text-black"
                onClick={(e) => e.stopPropagation()}
                title="Download"
              >
                ⬇️
              </a>
              <button
                onClick={() => setViewerImage(null)}
                className="p-2 bg-white/90 hover:bg-white rounded-full text-black"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
