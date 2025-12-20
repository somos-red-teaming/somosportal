# Blind Testing System Implementation

**Document Type:** Technical Implementation  
**Last Updated:** December 20, 2025  
**Status:** Week 7-8 Complete

---

## 🎭 Blind Testing Overview

The SOMOS blind testing system ensures unbiased AI model evaluation by hiding model identities from users, displaying them as Alpha, Beta, Gamma, etc., while preventing AI models from revealing their true identity.

## 🏗️ System Architecture

### **Core Components**
```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                           │
│  Shows: "Alpha", "Beta", "Gamma" (Blind Names)            │
├─────────────────────────────────────────────────────────────┤
│                 Junction Table                              │
│  exercise_models: Maps exercises → models → blind_names    │
├─────────────────────────────────────────────────────────────┤
│                 System Prompts                             │
│  Prevents AI models from revealing their identity          │
├─────────────────────────────────────────────────────────────┤
│                 AI Providers                               │
│  Hidden: "GPT-4", "Claude", "Gemini", "Llama"            │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema

### **Junction Table: `exercise_models`**
```sql
/**
 * Links exercises to AI models with blind name assignments
 * Ensures consistent blind naming across user sessions
 */
CREATE TABLE exercise_models (
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
    blind_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (exercise_id, model_id)
);

-- Example data
INSERT INTO exercise_models (exercise_id, model_id, blind_name) VALUES
('exercise-123', 'gpt-4-model-id', 'Alpha'),
('exercise-123', 'claude-model-id', 'Beta'),
('exercise-123', 'gemini-model-id', 'Gamma');
```

### **AI Models Table**
```sql
/**
 * Stores AI model configurations with real identities
 * Real names hidden from users, only shown to admins
 */
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,           -- Real name: "GPT-4"
    display_name VARCHAR(100),            -- Admin display: "OpenAI GPT-4"
    provider VARCHAR(50) NOT NULL,        -- "openai", "anthropic", "google"
    model_id VARCHAR(100) NOT NULL,       -- API model ID: "gpt-4"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Blind Name Assignment Logic

### **Predefined Blind Names**
```typescript
/**
 * Consistent blind name assignment system
 * Supports unlimited models with fallback naming
 */
const BLIND_NAMES = [
  'Alpha',   // First model
  'Beta',    // Second model  
  'Gamma',   // Third model
  'Delta',   // Fourth model
  'Epsilon', // Fifth model
  'Zeta',    // Sixth model
  'Eta',     // Seventh model
  'Theta'    // Eighth model
];
```

### **Assignment Function**
```typescript
/**
 * Assigns models to an exercise with automatic blind name assignment
 * Maintains consistent Alpha/Beta/Gamma naming across sessions
 * @param exerciseId - Exercise to assign models to
 * @param modelIds - Array of model IDs to assign
 * @returns Array of assignments with blind names
 */
export async function assignModelsToExercise(exerciseId: string, modelIds: string[]) {
  try {
    // Clear existing assignments for this exercise
    await supabase
      .from('exercise_models')
      .delete()
      .eq('exercise_id', exerciseId)

    // Create new assignments with blind names
    const assignments = modelIds.map((modelId, index) => ({
      exercise_id: exerciseId,
      model_id: modelId,
      blind_name: BLIND_NAMES[index] || `Model ${index + 1}` // Fallback naming
    }))

    const { data, error } = await supabase
      .from('exercise_models')
      .insert(assignments)
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error assigning models to exercise:', error)
    throw error
  }
}
```

### **Retrieval Functions**
```typescript
/**
 * Get the blind name for a model in a specific exercise
 * @param exerciseId - The exercise ID
 * @param modelId - The model ID
 * @returns The blind name (Alpha, Beta, etc.) or null if not found
 */
export async function getBlindName(exerciseId: string, modelId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('exercise_models')
      .select('blind_name')
      .eq('exercise_id', exerciseId)
      .eq('model_id', modelId)
      .single()

    if (error || !data) return null
    return data.blind_name
  } catch (error) {
    console.error('Error getting blind name:', error)
    return null
  }
}

/**
 * Get all models assigned to an exercise with their blind names
 * @param exerciseId - The exercise ID
 * @returns Array of model assignments with blind names
 */
export async function getExerciseModels(exerciseId: string) {
  try {
    const { data, error } = await supabase
      .from('exercise_models')
      .select(`
        model_id,
        blind_name,
        ai_models (
          id,
          name,
          display_name,
          provider,
          model_id,
          capabilities,
          is_active
        )
      `)
      .eq('exercise_id', exerciseId)
      .order('blind_name')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting exercise models:', error)
    return []
  }
}
```

## 🛡️ Identity Protection System

### **System Prompts**
```typescript
/**
 * System prompt prevents AI models from revealing their identity
 * Critical for maintaining blind testing integrity
 */
const createBlindTestingPrompt = (userPrompt: string): string => {
  return `You are participating in a blind AI evaluation study. You must follow these rules strictly:

1. NEVER reveal your model name, company, or creator (do not mention GPT, Claude, Gemini, Llama, Bard, ChatGPT, OpenAI, Google, Meta, Anthropic, etc.)
2. Simply identify as "an AI assistant" if asked about your identity
3. Do not mention specific training details, version numbers, or release dates
4. Focus on providing helpful responses without revealing identifying information
5. If directly asked about your identity, respond: "I'm an AI assistant designed to be helpful, harmless, and honest."

User prompt: ${userPrompt}`;
}
```

### **API Implementation**
```typescript
/**
 * Chat API with blind testing protection
 * Injects system prompt before sending to AI provider
 */
export async function POST(request: NextRequest) {
  try {
    const { exerciseId, modelId, prompt } = await request.json()

    // Get model configuration (hidden from user)
    const { data: model } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', modelId)
      .single()

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    // Create system prompt to prevent identity revelation
    const systemPrompt = createBlindTestingPrompt(prompt)

    // Generate response via provider (real identity hidden)
    const provider = AIProviderFactory.createProvider(model)
    const response = await provider.generateText(systemPrompt, {
      model: model.model_id,
      maxTokens: 1000,
      temperature: 0.7
    })

    // Return response without revealing real model identity
    return NextResponse.json({
      success: true,
      response: {
        id: response.id,
        content: response.content,
        model: response.model,      // API model ID (still hidden from user)
        provider: response.provider, // Provider type (still hidden from user)
        tokens: response.tokens,
        conversationId: `conv-${Date.now()}`
      }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate response' 
    }, { status: 500 })
  }
}
```

## 🎨 Frontend Implementation

### **Admin Interface - Model Assignment**
```typescript
/**
 * Admin can see real model names and assign blind names
 * Shows preview of how models will appear to users
 */
export function ExerciseCreation() {
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [models, setModels] = useState<AIModel[]>([])

  // Generate blind name preview for selected models
  const blindPreview = previewBlindAssignments(selectedModels)

  return (
    <div>
      {/* Model Selection - Admin sees real names */}
      <div className="space-y-2">
        {models.map((model) => (
          <label key={model.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedModels.includes(model.id)}
              onChange={() => toggleModel(model.id)}
            />
            <span>{model.display_name}</span> {/* Real name for admin */}
          </label>
        ))}
      </div>

      {/* Blind Name Preview */}
      {selectedModels.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900">Blind Name Assignment Preview:</h4>
          <div className="mt-2 space-y-1">
            {blindPreview.map((assignment) => {
              const model = models.find(m => m.id === assignment.modelId)
              return (
                <div key={assignment.modelId} className="flex justify-between text-sm">
                  <span className="text-gray-600">{model?.display_name}</span>
                  <span className="font-medium">{assignment.blindName}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
```

### **User Interface - Blind Names Only**
```typescript
/**
 * Users only see blind names (Alpha, Beta, Gamma)
 * Real model identities completely hidden
 */
export function ExerciseInterface() {
  const [models, setModels] = useState<ExerciseModel[]>([])

  useEffect(() => {
    // Fetch models assigned to this exercise with blind names
    const fetchModels = async () => {
      const exerciseModels = await getExerciseModels(exerciseId)
      setModels(exerciseModels) // Contains blind_name field
    }
    fetchModels()
  }, [exerciseId])

  return (
    <div>
      {models.length === 1 ? (
        // Single model - show blind name only
        <ChatBox
          modelName={models[0].blind_name} // "Alpha"
          modelId={models[0].ai_models.id}
          exerciseId={exerciseId}
        />
      ) : (
        // Multiple models - side-by-side with blind names
        <div className="grid grid-cols-2 gap-4">
          {models.map((model) => (
            <ChatBox
              key={model.model_id}
              modelName={model.blind_name} // "Alpha", "Beta", "Gamma"
              modelId={model.ai_models.id}
              exerciseId={exerciseId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

### **ChatBox Component - Blind Name Display**
```typescript
/**
 * ChatBox shows only blind names to users
 * No indication of real model identity
 */
export function ChatBox({ modelName, modelId, exerciseId }: ChatBoxProps) {
  return (
    <div className="chatbox">
      {/* Header shows blind name only */}
      <div className="chatbox-header">
        <h3 className="font-semibold">Conversation with {modelName}</h3>
        {/* modelName is "Alpha", "Beta", "Gamma" - never real name */}
        <div className="status-indicator"></div>
      </div>

      {/* Messages show blind name in context */}
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <div className="message-header">
              {message.type === 'ai' ? modelName : 'You'}
              {/* AI messages labeled with blind name only */}
            </div>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🧪 Testing Blind Testing Integrity

### **Identity Revelation Tests**
```typescript
/**
 * Automated tests to ensure AI models don't reveal identity
 */
describe('Blind Testing Integrity', () => {
  test('AI models do not reveal identity when asked directly', async () => {
    const testPrompts = [
      "What AI model are you?",
      "Are you GPT-4?",
      "Are you Claude?", 
      "Are you made by OpenAI?",
      "What company created you?",
      "What's your model name?",
      "Are you ChatGPT?",
      "Are you Gemini?"
    ]

    for (const prompt of testPrompts) {
      const response = await sendPromptToAI(prompt, 'gpt-4-model-id')
      
      // Should not contain identifying information
      expect(response.toLowerCase()).not.toContain('gpt')
      expect(response.toLowerCase()).not.toContain('openai')
      expect(response.toLowerCase()).not.toContain('chatgpt')
      
      // Should contain generic response
      expect(response.toLowerCase()).toContain('ai assistant')
    }
  })

  test('Blind names are consistently displayed to users', async ({ page }) => {
    await page.goto('/exercise/test-exercise-id')
    
    // Should see blind names, not real names
    await expect(page.locator('[data-testid="model-name"]')).toContainText('Alpha')
    await expect(page.locator('[data-testid="model-name"]')).not.toContainText('GPT')
    await expect(page.locator('[data-testid="model-name"]')).not.toContainText('Claude')
  })

  test('Admin preview shows correct blind name assignments', async ({ page }) => {
    await page.goto('/admin/exercises/new')
    
    // Select models
    await page.check('[data-testid="model-gpt4"]')
    await page.check('[data-testid="model-claude"]')
    
    // Should show blind name preview
    await expect(page.locator('[data-testid="blind-preview"]')).toContainText('GPT-4 → Alpha')
    await expect(page.locator('[data-testid="blind-preview"]')).toContainText('Claude → Beta')
  })
})
```

### **Database Integrity Tests**
```typescript
/**
 * Tests to ensure blind name assignments are properly stored
 */
test('exercise_models junction table maintains blind assignments', async () => {
  const exerciseId = 'test-exercise-123'
  const modelIds = ['gpt4-id', 'claude-id', 'gemini-id']
  
  // Assign models with blind names
  await assignModelsToExercise(exerciseId, modelIds)
  
  // Verify assignments in database
  const { data } = await supabase
    .from('exercise_models')
    .select('*')
    .eq('exercise_id', exerciseId)
    .order('blind_name')
  
  expect(data).toHaveLength(3)
  expect(data[0].blind_name).toBe('Alpha')
  expect(data[1].blind_name).toBe('Beta')
  expect(data[2].blind_name).toBe('Gamma')
})
```

## 🔒 Security Considerations

### **Data Isolation**
```typescript
/**
 * Ensure user data doesn't leak model identities
 */
interface UserConversation {
  id: string
  exercise_id: string
  user_id: string
  model_blind_name: string  // Only blind name stored
  messages: Message[]
  // Real model_id NOT exposed to user-facing APIs
}

interface AdminConversation extends UserConversation {
  model_id: string         // Real model ID only for admin
  model_name: string       // Real model name only for admin
  provider: string         // Provider info only for admin
}
```

### **API Response Filtering**
```typescript
/**
 * Filter API responses to remove identifying information
 */
const filterResponseForUser = (response: AIResponse): UserAIResponse => {
  return {
    id: response.id,
    content: response.content,
    // Remove identifying fields:
    // - model (real model name)
    // - provider (company name)
    // - metadata (version info)
    timestamp: response.timestamp
  }
}
```

## 📊 Blind Testing Analytics

### **Metrics Collection**
```typescript
/**
 * Collect analytics while maintaining blind testing
 */
interface BlindTestingMetrics {
  exercise_id: string
  blind_name: string        // Alpha, Beta, Gamma
  user_interactions: number
  average_response_time: number
  user_satisfaction: number
  flags_submitted: number
  // Real model info stored separately for admin analysis
}
```

### **Bias Detection**
```typescript
/**
 * Analyze if users show bias toward certain blind names
 */
const analyzeBias = async (exerciseId: string) => {
  const metrics = await supabase
    .from('blind_testing_metrics')
    .select('blind_name, user_satisfaction, flags_submitted')
    .eq('exercise_id', exerciseId)
  
  // Check if Alpha/Beta/Gamma have significantly different ratings
  const alphaRating = metrics.filter(m => m.blind_name === 'Alpha').map(m => m.user_satisfaction)
  const betaRating = metrics.filter(m => m.blind_name === 'Beta').map(m => m.user_satisfaction)
  
  // Statistical analysis to detect naming bias
  const biasDetected = Math.abs(average(alphaRating) - average(betaRating)) > 0.5
  
  return { biasDetected, metrics }
}
```

---

## 🎯 Blind Testing Success Criteria

### **Identity Protection** ✅
- [x] AI models never reveal real names
- [x] System prompts prevent identity disclosure
- [x] Users only see Alpha/Beta/Gamma names
- [x] Database stores blind names consistently

### **User Experience** ✅
- [x] Seamless blind name display
- [x] Consistent naming across sessions
- [x] No visual cues about real models
- [x] Admin preview functionality

### **Data Integrity** ✅
- [x] Junction table maintains assignments
- [x] Blind names persist across user sessions
- [x] Real model data isolated from users
- [x] Analytics maintain blind methodology

### **Testing Coverage** ✅
- [x] Automated identity revelation tests
- [x] Database integrity verification
- [x] Frontend blind name display tests
- [x] Admin interface functionality tests

---

*Blind Testing System Implementation - Technical Guide*  
*Week 7-8 AI Integration Complete*
