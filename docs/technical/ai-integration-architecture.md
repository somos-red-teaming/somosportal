# AI Integration Architecture

**Document Type:** Technical Implementation  
**Last Updated:** December 20, 2025  
**Status:** Week 7-8 Complete

---

## 🏗️ System Architecture Overview

The SOMOS AI Integration follows a modular provider pattern with blind testing capabilities, supporting multiple AI providers through a unified interface.

### **Core Components**

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  ChatBox Components  │  Exercise Interface  │  Admin Panel  │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                                │
├─────────────────────────────────────────────────────────────┤
│  /api/ai/chat  │  /api/ai/image  │  /api/models  │  /api/ai/test │
├─────────────────────────────────────────────────────────────┤
│                 Provider Abstraction                       │
├─────────────────────────────────────────────────────────────┤
│  AIProviderFactory  │  Blind Assignment  │  System Prompts │
├─────────────────────────────────────────────────────────────┤
│                   AI Providers                             │
├─────────────────────────────────────────────────────────────┤
│  Google Gemini  │  Groq Llama  │  OpenAI  │  Anthropic     │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Provider Architecture

### **Base Provider Interface**
```typescript
/**
 * Base interface for all AI providers
 * Defines standard methods for text generation, image generation, and connection testing
 */
export interface AIProvider {
  name: string
  type: 'openai' | 'anthropic' | 'google' | 'groq' | 'custom'
  
  // Text generation with options
  generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResponse>
  
  // Image generation (optional)
  generateImage?(prompt: string, options?: GenerateImageOptions): Promise<AIImageResponse>
  
  // Connection testing
  testConnection(): Promise<boolean>
}
```

### **Provider Factory Pattern**
```typescript
/**
 * Factory class for creating AI provider instances
 * Handles provider selection and configuration
 * Custom providers receive endpoint and apiKeyEnv from database
 */
export class AIProviderFactory {
  static createProvider(config: AIModelConfig): AIProvider {
    switch (config.provider) {
      case 'google': return new GoogleProvider()
      case 'groq': return new GroqProvider()
      case 'openai': return new OpenAIProvider()
      case 'anthropic': return new AnthropicProvider()
      case 'custom': return new CustomProvider({
        endpoint: config.configuration?.endpoint,
        apiKeyEnv: config.configuration?.apiKeyEnv,
        modelId: config.model_id
      })
      default: throw new Error(`Unsupported provider: ${config.provider}`)
    }
  }
}
```

## 🔧 Custom Model Configuration

### **Adding Custom Models**
Custom models are configured via Admin UI with secure API key handling:

1. **API Key** - Stored in environment variable (e.g., `MY_API_KEY=sk-xxx`)
2. **Endpoint URL** - Stored in database `configuration` column
3. **Env Var Name** - Referenced in database, actual key fetched at runtime

```json
// Database configuration column for custom models
{
  "endpoint": "https://your-api.com/v1",
  "apiKeyEnv": "MY_API_KEY"
}
```

### **Security Model**
- ✅ API keys never stored in database
- ✅ Only env var names referenced in DB
- ✅ Keys fetched from environment at runtime
- ✅ Works with any OpenAI-compatible API

## 🎭 Blind Testing Architecture

### **Junction Table Design**
```sql
-- exercise_models: Links exercises to AI models with blind names
CREATE TABLE exercise_models (
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
    blind_name VARCHAR(50) NOT NULL, -- Alpha, Beta, Gamma, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (exercise_id, model_id)
);
```

### **Blind Name Assignment Logic**
```typescript
// Predefined blind names for consistent assignment
const BLIND_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];

/**
 * Assigns models to an exercise with automatic blind name assignment
 * Ensures consistent Alpha/Beta/Gamma naming across sessions
 */
export async function assignModelsToExercise(exerciseId: string, modelIds: string[]) {
  const assignments = modelIds.map((modelId, index) => ({
    exercise_id: exerciseId,
    model_id: modelId,
    blind_name: BLIND_NAMES[index] || `Model ${index + 1}`
  }));
  
  return await supabase.from('exercise_models').insert(assignments);
}
```

## 🛡️ Security & Privacy

### **System Prompts for Identity Protection**
```typescript
/**
 * System prompt prevents AI models from revealing their identity
 * Critical for maintaining blind testing integrity
 */
const systemPrompt = `You are participating in a blind AI evaluation study. You must follow these rules strictly:

1. NEVER reveal your model name, company, or creator
2. Simply identify as "an AI assistant" if asked about your identity
3. Do not mention specific training details, version numbers, or release dates
4. Focus on providing helpful responses without revealing identifying information
5. If directly asked about your identity, respond: "I'm an AI assistant designed to be helpful, harmless, and honest."

User prompt: ${prompt}`;
```

### **Data Flow Security**
1. **User Input** → Sanitized and validated
2. **System Prompt** → Prepended to prevent identity revelation
3. **AI Provider** → Processes combined prompt
4. **Response** → Filtered and formatted
5. **Database** → Stored with blind name reference only

## 📱 Frontend Architecture

### **ChatBox Component Structure**
```typescript
/**
 * Individual chatbox component for conversation with a single AI model
 * Handles conversation threading, formatting, and mobile optimization
 */
export function ChatBox({ 
  modelName,     // Blind name (Alpha, Beta, Gamma)
  modelId,       // Internal model ID for API calls
  exerciseId,    // Exercise context
  onSendMessage  // Analytics callback
}: ChatBoxProps) {
  // Conversation state management
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Auto-scroll and mobile optimization
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  // Touch handling for scroll isolation
  const handleTouchStart = (e: React.TouchEvent) => { /* ... */ }
  const handleTouchMove = (e: React.TouchEvent) => { /* ... */ }
}
```

### **Responsive Layout System**
```typescript
// Dynamic layout based on number of assigned models
{models.length === 1 ? (
  // Single model: Full-width chatbox
  <div className="h-[calc(100vh-200px)] max-h-[600px] min-h-[400px] w-full">
    <ChatBox modelName={models[0].blind_name} ... />
  </div>
) : (
  // Multiple models: Side-by-side comparison
  <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4 w-full">
    {models.slice(0, 2).map((model) => (
      <ChatBox key={model.model_id} modelName={model.blind_name} ... />
    ))}
  </div>
)}
```

## 🔌 API Architecture

### **Chat Endpoint Design**
```typescript
/**
 * POST /api/ai/chat
 * Handles text generation with blind testing protection
 */
export async function POST(request: NextRequest) {
  const { exerciseId, modelId, prompt } = await request.json()
  
  // 1. Validate inputs
  if (!exerciseId || !modelId || !prompt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  
  // 2. Get model configuration
  const { data: model } = await supabase
    .from('ai_models')
    .select('*')
    .eq('id', modelId)
    .single()
  
  // 3. Create system prompt for blind testing
  const systemPrompt = createBlindTestingPrompt(prompt)
  
  // 4. Generate response via provider
  const provider = AIProviderFactory.createProvider(model)
  const response = await provider.generateText(systemPrompt, options)
  
  // 5. Return formatted response
  return NextResponse.json({ success: true, response })
}
```

### **Image Generation Routing**
```typescript
/**
 * Provider-specific image generation routing
 * Google models → Nano Banana, OpenAI models → DALL-E 3
 */
const getImageProvider = (model: AIModel) => {
  switch (model.provider) {
    case 'google':
      return { provider: 'google', model: 'gemini-pro-vision' } // Nano Banana 🍌
    case 'openai':
      return { provider: 'openai', model: 'dall-e-3' }
    default:
      throw new Error(`Image generation not supported for ${model.provider}`)
  }
}
```

## 📊 Performance Considerations

### **Response Time Optimization**
- **Google Gemini:** 2-4 seconds average
- **Groq Llama:** 1-2 seconds (fastest)
- **OpenAI GPT-4:** 3-6 seconds
- **Anthropic Claude:** 4-8 seconds

### **Caching Strategy**
```typescript
// Model configuration caching
const modelCache = new Map<string, AIModel>()

// Response caching for identical prompts (optional)
const responseCache = new Map<string, AIResponse>()
```

### **Error Handling & Fallbacks**
```typescript
/**
 * Graceful degradation when providers fail
 */
try {
  const response = await provider.generateText(prompt, options)
  return response
} catch (error) {
  console.error(`Provider ${provider.name} failed:`, error)
  
  // Return user-friendly error message
  return {
    id: `error-${Date.now()}`,
    content: 'I apologize, but I encountered an issue processing your request. Please try again.',
    model: 'error',
    provider: provider.type
  }
}
```

## 🔄 Data Flow Diagram

```
User Input → Exercise Interface → ChatBox Component
    ↓
API Route (/api/ai/chat) → Input Validation
    ↓
Model Configuration → Blind Name Lookup
    ↓
System Prompt Creation → Identity Protection
    ↓
AI Provider Factory → Provider Selection
    ↓
AI Provider (Google/Groq/OpenAI/Anthropic) → Response Generation
    ↓
Response Processing → Formatting & Sanitization
    ↓
Database Storage → Conversation History (with blind names)
    ↓
Frontend Update → ChatBox Display → User sees "Alpha" response
```

## 🧪 Testing Architecture

### **Provider Testing**
```typescript
/**
 * Automated testing for each AI provider
 */
test('AI provider integration', async ({ page }) => {
  // Test Google Gemini
  await testProvider(page, 'google', 'Hello, how are you?')
  
  // Test Groq Llama
  await testProvider(page, 'groq', 'Write a simple function')
  
  // Verify blind names are displayed
  await expect(page.locator('[data-testid="model-name"]')).toContainText('Alpha')
})
```

### **Blind Testing Validation**
```typescript
/**
 * Ensures AI models don't reveal their identity
 */
test('blind testing integrity', async ({ page }) => {
  const response = await sendPrompt(page, "What AI model are you?")
  
  // Should not contain identifying information
  expect(response).not.toContain('GPT')
  expect(response).not.toContain('Claude')
  expect(response).not.toContain('Gemini')
  expect(response).not.toContain('Llama')
  
  // Should contain generic response
  expect(response).toContain('AI assistant')
})
```

---

## 🚀 Deployment Architecture

### **Environment Configuration**
```bash
# AI Provider API Keys
GOOGLE_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Custom API Configuration
CUSTOM_ENDPOINT=https://your-api.com
CUSTOM_API_KEY=your_key
```

### **Netlify Deployment**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NEXT_PRIVATE_TARGET = "server"
```

---

*AI Integration Architecture - Technical Implementation Guide*  
*Week 7-8 AI Integration Complete*
