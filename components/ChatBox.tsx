'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, User, Bot, Copy, Image, Flag, Settings2, X, Plus, History, MessageSquare, Paperclip, FileText } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { TimerDisplay } from './TimerDisplay'
import { createClient } from '@/lib/supabase/client'

// Component to load images from private storage with signed URL
function ImageFromStorage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
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
  imageUrl?: string
  attachedFile?: string // File name if file was attached
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
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null)
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Session ID for grouping conversation
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
  const [sessions, setSessions] = useState<{ id: string; date: string; messageCount: number }[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  const SESSIONS_PER_PAGE = 5
  const messageCache = useRef<Map<string, Message[]>>(new Map())

  // Build sessions list from initial history
  useEffect(() => {
    if (initialHistory && initialHistory.length > 0) {
      const sessionMap = new Map<string, { date: string; count: number }>()
      initialHistory.forEach((interaction: any) => {
        const sid = interaction.session_id || 'legacy'
        if (!sessionMap.has(sid)) {
          sessionMap.set(sid, { date: interaction.created_at, count: 0 })
        }
        sessionMap.get(sid)!.count++
      })
      const list = Array.from(sessionMap.entries()).map(([id, info]) => ({
        id,
        date: new Date(info.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        messageCount: info.count
      }))
      setSessions(list)
      // Resume last session
      if (list.length > 0) {
        setSessionId(list[list.length - 1].id)
      }
    }
  }, [initialHistory])

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

  // Parse file content into formatted text
  const parseFile = useCallback((file: File): Promise<{ name: string; content: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const ext = file.name.split('.').pop()?.toLowerCase()
          
          let formatted = text
          if (ext === 'csv') {
            // Parse CSV into markdown table
            const lines = text.trim().split('\n')
            if (lines.length > 0) {
              const headers = lines[0].split(',').map(h => h.trim())
              const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()))
              
              formatted = `\n| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`
              formatted += rows.map(row => `| ${row.join(' | ')} |`).join('\n') + '\n'
            }
          }
          
          resolve({ name: file.name, content: formatted })
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Limit to 500KB
    if (file.size > 500000) {
      alert('File too large (max 500KB)')
      return
    }
    
    try {
      const parsed = await parseFile(file)
      setAttachedFile(parsed)
    } catch (error) {
      alert('Failed to read file')
    }
    
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [parseFile])

  // Load history filtered by current session (check cache first)
  useEffect(() => {
    // Check cache first
    if (messageCache.current.has(sessionId)) {
      setMessages(messageCache.current.get(sessionId)!)
      return
    }
    if (initialHistory && initialHistory.length > 0) {
      const filtered = initialHistory.filter((i: any) => 
        (i.session_id || 'legacy') === sessionId
      )
      const history: Message[] = []
      filtered.forEach((interaction: any) => {
        // Detect attached file from prompt format: [File: name]\n...\n[User message]\n...
        const fileMatch = interaction.prompt.match(/^\[File: (.+?)\]/)
        history.push({
          id: `${interaction.id}-user`,
          type: 'user',
          content: interaction.prompt,
          timestamp: new Date(interaction.created_at),
          attachedFile: fileMatch ? fileMatch[1] : undefined
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
      setMessages(history)
    } else {
      setMessages([])
    }
  }, [sessionId, initialHistory])

  // Cache messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      messageCache.current.set(sessionId, messages)
    }
  }, [messages, sessionId])

  const startNewConversation = () => {
    const newId = crypto.randomUUID()
    // Add current session to list if it has messages
    if (messages.length > 0) {
      const existing = sessions.find(s => s.id === sessionId)
      if (existing) {
        // Update message count for current session
        setSessions(prev => prev.map(s => s.id === sessionId 
          ? { ...s, messageCount: messages.filter(m => m.type === 'user').length }
          : s
        ))
      } else {
        setSessions(prev => [...prev, {
          id: sessionId,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          messageCount: messages.filter(m => m.type === 'user').length
        }])
      }
    }
    setSessionId(newId)
    setMessages([])
    setSuggestions([])
    setShowHistory(false)
    setHistoryPage(0)
  }

  const switchSession = (sid: string) => {
    // Save current session's message count before switching
    if (messages.length > 0 && sessions.find(s => s.id === sessionId)) {
      setSessions(prev => prev.map(s => s.id === sessionId
        ? { ...s, messageCount: messages.filter(m => m.type === 'user').length }
        : s
      ))
    }
    setSessionId(sid)
    setSuggestions([])
    setShowHistory(false)
  }

  // Track current session in the list whenever messages change
  useEffect(() => {
    if (messages.length === 0) return
    const userCount = messages.filter(m => m.type === 'user').length
    if (userCount === 0) return
    
    setSessions(prev => {
      const existing = prev.find(s => s.id === sessionId)
      if (existing) {
        return prev.map(s => s.id === sessionId ? { ...s, messageCount: userCount } : s)
      }
      return [...prev, {
        id: sessionId,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        messageCount: userCount
      }]
    })
  }, [messages, sessionId])

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
      const supabase = createClient()
      const { data: exercise } = await supabase.from('exercises').select('flag_package_id').eq('id', exerciseId).single()
      
      if (exercise?.flag_package_id) {
        const { data: categories } = await supabase.from('flag_categories').select('value, label').eq('package_id', exercise.flag_package_id).order('sort_order')
        
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

    // Prepend file content if attached (truncate to ~4000 chars to avoid payload limits)
    let fullPrompt = inputMessage.trim()
    if (attachedFile) {
      const maxFileChars = 4000
      const truncatedContent = attachedFile.content.length > maxFileChars
        ? attachedFile.content.slice(0, maxFileChars) + '\n... (truncated)'
        : attachedFile.content
      fullPrompt = `[File: ${attachedFile.name}]\n${truncatedContent}\n\n[User message]\n${fullPrompt}`
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: fullPrompt,
      timestamp: new Date(),
      attachedFile: attachedFile?.name
    }
    const userPromptForSuggestions = inputMessage.trim()

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setAttachedFile(null)
    setSuggestions([])
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          modelId,
          prompt: fullPrompt,
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
        // Fetch follow-up suggestions in background (skip if AI leaked identity or refused)
        const lower = data.response.content.toLowerCase()
        const leaked = ['i\'m claude', 'i am claude', 'made by anthropic', 'i\'m gpt', 'i am gpt', 'made by openai', 'i\'m gemini', 'made by google', 'can\'t discuss my system', 'cannot discuss my system']
        if (!leaked.some(phrase => lower.includes(phrase))) {
          fetchSuggestions(data.response.content, userPromptForSuggestions)
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
  /** Fetch follow-up prompt suggestions after AI response */
  const fetchSuggestions = async (aiResponse: string, userPrompt: string) => {
    try {
      const supabase = createClient()
      const { data: exercise } = await supabase.from('exercises').select('title, description').eq('id', exerciseId).single()
      const context = exercise ? `Exercise: "${exercise.title}". ${exercise.description || ''}` : ''
      
      const res = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt,
          aiResponse,
          exerciseContext: context
        }),
      })
      const data = await res.json()
      if (data.suggestions?.length > 0) {
        setSuggestions(data.suggestions)
      }
    } catch {
      // Silently fail — suggestions are optional
    }
  }

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
        <div
          className="mb-2 last:mb-0 break-words hyphens-auto leading-relaxed"
          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
        >
          {children}
        </div>
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
          {/* New Chat button */}
          <Button
            size="sm"
            onClick={startNewConversation}
            className="h-8 px-2 flex-shrink-0 gap-1 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            title="Start new conversation"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">New Chat</span>
          </Button>

          {/* History dropdown */}
          <DropdownMenu open={showHistory} onOpenChange={setShowHistory}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 px-2 flex-shrink-0 gap-1 cursor-pointer" title="Conversation history">
                <History className="h-3.5 w-3.5" />
                <span className="text-xs">History{sessions.length > 0 ? ` (${sessions.length})` : ''}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {sessions.length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground text-center">No previous conversations</div>
              ) : (
                <>
                  {sessions
                    .slice()
                    .reverse()
                    .slice(historyPage * SESSIONS_PER_PAGE, (historyPage + 1) * SESSIONS_PER_PAGE)
                    .map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() => switchSession(s.id)}
                      className={`cursor-pointer gap-2 ${s.id === sessionId ? 'bg-accent' : ''}`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="text-xs">{s.date}</span>
                        <span className="text-xs text-muted-foreground">{s.messageCount} messages</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  {sessions.length > SESSIONS_PER_PAGE && (
                    <div className="flex items-center justify-between px-2 py-1 border-t mt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        disabled={historyPage === 0}
                        onClick={(e) => { e.preventDefault(); setHistoryPage(p => p - 1) }}
                      >
                        Newer
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {historyPage + 1}/{Math.ceil(sessions.length / SESSIONS_PER_PAGE)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        disabled={(historyPage + 1) * SESSIONS_PER_PAGE >= sessions.length}
                        onClick={(e) => { e.preventDefault(); setHistoryPage(p => p + 1) }}
                      >
                        Older
                      </Button>
                    </div>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
                      <>
                        {message.attachedFile && (
                          <div className="mb-1">
                            <button
                              onClick={() => setExpandedFileId(expandedFileId === message.id ? null : message.id)}
                              className="flex items-center gap-1 text-blue-200 hover:text-white text-[10px]"
                            >
                              <span>{expandedFileId === message.id ? '▼' : '▶'}</span>
                              <Paperclip className="h-2.5 w-2.5" />
                              <span>{message.attachedFile}</span>
                            </button>
                            {expandedFileId === message.id && (() => {
                              const raw = message.content
                              const withoutHeader = raw.replace(/^\[File: .+?\]\n/, '')
                              const fileOnly = withoutHeader.split('\n\n[User message]\n')[0] || withoutHeader.split('[User message]\n')[0] || withoutHeader
                              return (
                                <div className="mt-1 p-2 bg-blue-600/30 rounded text-[10px] text-blue-100 max-h-48 overflow-y-auto">
                                  <div className="prose prose-xs max-w-none prose-invert">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                                      {fileOnly.trim()}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        )}
                        <p
                          className="whitespace-pre-wrap break-words hyphens-auto min-w-0 leading-relaxed"
                          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                        >
                          {message.content.includes('[User message]\n')
                            ? message.content.split('[User message]\n').pop()
                            : message.content}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="prose prose-sm max-w-none dark:prose-invert min-w-0 overflow-hidden">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
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

      {/* Prompt Suggestions */}
      {suggestions.length > 0 && !isLoading && (
        <div className="px-2 sm:px-3 py-1.5 flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                const fakeMsg = s
                setSuggestions([])
                const userMsg: Message = { id: `user-${Date.now()}`, type: 'user', content: fakeMsg, timestamp: new Date() }
                setMessages(prev => [...prev, userMsg])
                setIsLoading(true)
                fetch('/api/ai/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    exerciseId, modelId, prompt: fakeMsg, userId, conversationId: sessionId,
                    history: [...messages, userMsg].map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }))
                  }),
                }).then(r => r.json()).then(data => {
                  if (data.success) {
                    setMessages(prev => [...prev, { id: `ai-${Date.now()}`, type: 'ai' as const, content: data.response.content, timestamp: new Date() }])
                    const lower = data.response.content.toLowerCase()
                    const leaked = ['i\'m claude', 'i am claude', 'made by anthropic', 'i\'m gpt', 'i am gpt', 'made by openai', 'i\'m gemini', 'made by google', 'can\'t discuss my system', 'cannot discuss my system']
                    if (!leaked.some(phrase => lower.includes(phrase))) {
                      fetchSuggestions(data.response.content, fakeMsg)
                    }
                  }
                }).catch(() => {}).finally(() => setIsLoading(false))
              }}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

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
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4 mr-2" />
                Attach file
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.json,.md"
            onChange={handleFileSelect}
            className="hidden"
          />
          {attachedFile && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-xs text-green-700 dark:text-green-300">
              <FileText className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
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
