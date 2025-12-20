# Week 7-8 AI Integration - Detailed Implementation Plan

**Timeline:** Week 7-8 of 10-week development cycle  
**Status:** 🎯 80% Complete - Flow 5 (Image Generation) In Progress  
**Start Date:** December 15, 2025  
**Current Date:** December 20, 2025

---

## 🎯 Milestone Objectives

Implement comprehensive AI integration with multiple providers, blind testing system, and enhanced chat interface supporting both single model testing (government focus) and multi-model comparison (research focus).

---

## 📋 Core Deliverables

### **1. Database Foundation**
- ✅ Junction table linking exercises to AI models
- ✅ Default AI model configurations
- ✅ RLS policies for model management

### **2. AI Provider Integration**
- ✅ OpenAI (GPT-4 ready, DALL-E 3 pending)
- ✅ Anthropic (Claude 3 ready)
- ✅ Google (Gemini 2.5 Flash working, Nano Banana 🍌 pending)
- ✅ Groq (Llama 3.1 8B Instant working)
- ✅ Custom API support (government/research models)

### **3. API Infrastructure**
- ✅ `/api/ai/chat` - Text generation endpoint
- ❌ `/api/ai/image` - Image generation endpoint (pending)
- ✅ Blind model assignment system
- ✅ Error handling and rate limiting

### **4. Admin Interface**
- ✅ `/admin/models` - AI model management
- ✅ Enhanced `/admin/exercises` - Model selection per exercise
- ✅ Model configuration and testing

### **5. Enhanced Chat Interface**
- ✅ Dedicated chatbox per selected model
- ✅ Conversation threading per model
- ✅ Real AI responses replacing placeholders
- ✅ Response formatting (markdown, code blocks)
- ✅ Mobile-optimized with proper containment
- ❌ Image generation and display (pending)

### **6. Flagging System**
- ❌ Per-conversation flagging (not per response) - pending
- ❌ Individual flagging for each model conversation - pending
- ❌ Rating system per conversation - pending

---

## 🏗️ Implementation Phases

### **Phase 1: Database Setup (Day 1)**

#### **1.1 Junction Table**
```sql
-- File: database/add-exercise-models-junction.sql
CREATE TABLE exercise_models (
    exercise_id UUID REFERENCES exercises(id),
    model_id UUID REFERENCES ai_models(id),
    blind_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (exercise_id, model_id)
);
```

#### **1.2 Seed Default Models**
```sql
-- File: database/seed-ai-models.sql
INSERT INTO ai_models (name, display_name, provider, model_id) VALUES
('GPT-4', 'Model Alpha', 'openai', 'gpt-4'),
('Claude-3', 'Model Beta', 'anthropic', 'claude-3-sonnet'),
('Gemini Pro', 'Model Gamma', 'google', 'gemini-pro'),
('Nano Banana', 'Image Model Alpha', 'google', 'gemini-pro-vision');
```

#### **1.3 Update Exercise Schema**
- Remove `target_models` TEXT[] field (replaced by junction table)
- Ensure compatibility with existing exercises

### **Phase 2: API Infrastructure (Days 2-3)**

#### **2.1 AI Provider Abstraction**
```typescript
// File: lib/ai-providers/base.ts
interface AIProvider {
  name: string
  type: 'openai' | 'anthropic' | 'google' | 'custom'
  generateText(prompt: string): Promise<string>
  generateImage?(prompt: string): Promise<string>
}
```

#### **2.2 Provider Implementations**
- `lib/ai-providers/openai.ts` - GPT-4 + DALL-E 3
- `lib/ai-providers/anthropic.ts` - Claude 3
- `lib/ai-providers/google.ts` - Gemini + Nano Banana 🍌
- `lib/ai-providers/custom.ts` - Custom API endpoints

#### **2.3 API Routes**
```typescript
// File: app/api/ai/chat/route.ts
POST /api/ai/chat
{
  exerciseId: string,
  modelId: string,
  prompt: string,
  conversationId?: string
}

// File: app/api/ai/image/route.ts  
POST /api/ai/image
{
  exerciseId: string,
  modelId: string,
  prompt: string
}
```

#### **2.4 Blind Model Assignment**
```typescript
// File: lib/blind-assignment.ts
function getBlindName(exerciseId: string, modelId: string): string
function getModelConfig(exerciseId: string, blindName: string): AIModel
```

### **Phase 3: Admin Interface (Day 4)**

#### **3.1 Model Management Page**
```typescript
// File: app/admin/models/page.tsx
- List all AI models
- Add/edit/delete models
- Test model connections
- Configure API keys and endpoints
- Enable/disable models
```

#### **3.2 Enhanced Exercise Creation**
```typescript
// File: app/admin/exercises/page.tsx (enhanced)
- Model selection during exercise creation
- Blind name assignment preview
- Model capability validation
- Exercise type selection (text/image/both)
```

#### **3.3 Model Configuration Interface**
```typescript
// Components:
- ModelForm: Add/edit AI models
- ModelTester: Test API connections
- ModelSelector: Multi-select for exercises
- BlindNamePreview: Show assigned blind names
```

### **Phase 4: Frontend Integration (Days 5-6)**

#### **4.1 Chat Interface Refactor**
```typescript
// File: app/exercise/[id]/ExerciseClient.tsx (major refactor)
Current: Side-by-side response cards
New: Dedicated chatbox per model

Layout:
- 1 model = 1 chatbox
- 2 models = 2 chatboxes side-by-side  
- 3 models = 3 chatboxes (responsive grid)
```

#### **4.2 Conversation Threading**
```typescript
// New components:
- ConversationThread: Individual model conversation
- MessageBubble: User/AI message display
- ConversationActions: Flag, rate, export
```

#### **4.3 Response Formatting**
```typescript
// Features:
- Markdown rendering for text responses
- Code syntax highlighting
- Image display and gallery
- Copy to clipboard
- Response comparison tools
```

#### **4.4 Real AI Integration**
```typescript
// Replace placeholder responses with:
- Real API calls to selected providers
- Loading states during generation
- Error handling for API failures
- Retry mechanisms
```

### **Phase 5: Image Generation (Day 6)**

#### **5.1 Nano Banana Integration**
```typescript
// Google Gemini Image generation
- Prompt optimization for image generation
- Image quality settings
- Safety filters
- Response caching
```

#### **5.2 DALL-E 3 Integration**
```typescript
// OpenAI DALL-E 3
- Style and quality parameters
- Size options
- Content policy handling
```

#### **5.3 Image Display Interface**
```typescript
// Components:
- ImageGallery: Display generated images
- ImageViewer: Full-size image modal
- ImageActions: Download, share, flag
```

### **Phase 6: Flagging System (Day 7)**

#### **6.1 Per-Conversation Flagging**
```typescript
// Implementation based on JP's feedback:
- Flag entire conversation with each model
- Not individual responses
- Separate flagging per model conversation
```

#### **6.2 Flagging Interface**
```typescript
// Components:
- ConversationFlag: Flag button per chatbox
- FlagModal: Detailed flagging form
- FlagSummary: Admin view of flagged conversations
```

#### **6.3 Database Integration**
```sql
-- Update flags table to reference conversations
ALTER TABLE flags ADD COLUMN conversation_id UUID;
ALTER TABLE flags ADD COLUMN model_id UUID;
```

### **Phase 7: Testing & Documentation (Day 7)**

#### **7.1 E2E Test Extensions**
```typescript
// New test cases:
- AI provider connections
- Model selection and assignment
- Real AI response generation
- Image generation workflow
- Conversation threading
- Flagging per conversation
```

#### **7.2 API Documentation**
```typescript
// Swagger/OpenAPI documentation
- AI endpoint specifications
- Model configuration schemas
- Error response formats
- Rate limiting details
```

---

## 🔧 Technical Requirements

### **Environment Variables**
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic  
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_AI_API_KEY=...

# Custom APIs (optional)
CUSTOM_API_ENDPOINT=https://...
CUSTOM_API_KEY=...
```

### **Database Changes**
1. ✅ Add `exercise_models` junction table
2. ✅ Seed default AI models
3. ✅ Update RLS policies
4. ✅ Add conversation tracking fields

### **New Dependencies**
```json
{
  "openai": "^4.0.0",
  "@anthropic-ai/sdk": "^0.9.0", 
  "@google/generative-ai": "^0.1.0",
  "react-markdown": "^9.0.0",
  "react-syntax-highlighter": "^15.5.0"
}
```

---

## 🎨 UI/UX Specifications

### **Model Selection Interface**
```
Exercise Creation:
┌─────────────────────────────────┐
│ Available Models:               │
│ ☑ GPT-4 (Text)          Alpha  │
│ ☑ Claude-3 (Text)       Beta   │
│ ☐ Gemini Pro (Text)     Gamma  │
│ ☐ Nano Banana (Image)   Delta  │
│ ☐ Custom Gov Model      Epsilon│
└─────────────────────────────────┘
```

### **Chat Interface Layout**

#### **Single Model (Government Focus)**
```
┌─────────────────────────────────┐
│ Conversation with Alpha         │
│ ┌─────────────────────────────┐ │
│ │ User: Hello                 │ │
│ │ Alpha: Hi there! How can... │ │
│ │ User: Tell me about...      │ │
│ │ Alpha: Sure, here's...      │ │
│ └─────────────────────────────┘ │
│ [Flag Conversation] [Rate: ⭐⭐⭐] │
└─────────────────────────────────┘
```

#### **Multi-Model Comparison**
```
┌─────────────────┐ ┌─────────────────┐
│ Conv with Alpha │ │ Conv with Beta  │
│ ┌─────────────┐ │ │ ┌─────────────┐ │
│ │ User: Hello │ │ │ │ User: Hello │ │
│ │ Alpha: Hi!  │ │ │ │ Beta: Hello!│ │
│ └─────────────┘ │ │ └─────────────┘ │
│ [Flag] [Rate]   │ │ [Flag] [Rate]   │
└─────────────────┘ └─────────────────┘
```

### **Image Generation Interface**
```
┌─────────────────────────────────┐
│ Image Generation with Delta     │
│ ┌─────────────────────────────┐ │
│ │ User: Generate a sunset     │ │
│ │ Delta: [Generated Image]    │ │
│ │        🖼️ 1024x1024        │ │
│ └─────────────────────────────┘ │
│ [Flag Image] [Download] [Share] │
└─────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### **Unit Tests**
- AI provider abstraction layer
- Blind name assignment logic
- Response formatting functions
- Error handling scenarios

### **Integration Tests**
- API route functionality
- Database model relationships
- AI provider connections
- Image generation pipeline

### **E2E Tests**
```typescript
// Key test scenarios:
1. Admin creates exercise with 2 models
2. User joins exercise and sees blind names
3. User sends prompt to both models
4. Real AI responses are displayed
5. User flags one conversation
6. Admin views flagged content
```

### **Performance Tests**
- API response times under load
- Concurrent AI requests
- Image generation and caching
- Database query optimization

---

## 📊 Success Metrics

### **Functional Requirements**
- ✅ All AI providers connected and working
- ✅ Blind testing system operational
- ✅ Per-conversation flagging implemented
- ✅ Image generation (Nano Banana + DALL-E 3)
- ✅ Admin model management interface
- ✅ Enhanced exercise creation

### **Performance Requirements**
- AI response time < 10 seconds
- Image generation < 30 seconds
- Page load time < 2 seconds
- 100% uptime for API endpoints

### **User Experience Requirements**
- Intuitive model selection
- Clear conversation threading
- Responsive design (mobile + desktop)
- Accessible interface (WCAG 2.1)

---

## 🚀 Deployment Checklist

### **Environment Setup**
- [ ] Add API keys to Cloudflare Pages
- [ ] Configure rate limiting
- [ ] Set up error monitoring
- [ ] Test all provider connections

### **Database Migration**
- [ ] Run junction table creation
- [ ] Seed default AI models
- [ ] Update RLS policies
- [ ] Verify data integrity

### **Frontend Deployment**
- [ ] Build and test locally
- [ ] Run full E2E test suite
- [ ] Deploy to staging
- [ ] Production deployment

---

## 🔄 Rollback Plan

### **If Issues Arise**
1. **Database:** Rollback migration scripts available
2. **API:** Feature flags to disable AI integration
3. **Frontend:** Fallback to placeholder responses
4. **Monitoring:** Sentry alerts for error tracking

---

## 📚 Documentation Deliverables

1. **API Documentation** - Swagger/OpenAPI specs
2. **Admin Guide** - Model management instructions  
3. **User Guide** - Enhanced chat interface
4. **Developer Guide** - AI provider integration
5. **Testing Guide** - E2E test scenarios

---

## 🎯 **CURRENT STATUS UPDATE (December 20, 2025):**

### **✅ COMPLETED FLOWS (80% Complete):**
- **Flow 1: AI Provider Integration** ✅ (Google Gemini + Groq Llama working)
- **Flow 2: Blind Assignment Logic** ✅ (Alpha, Beta, Gamma system working)  
- **Flow 3: Enhanced Exercise Creation** ✅ (Model assignment with blind preview)
- **Flow 4: Frontend AI Integration** ✅ (Mobile-optimized chatboxes with real AI)

### **🚧 REMAINING FLOWS:**
- **Flow 5: Image Generation** 🎯 **NEXT PRIORITY** (DALL-E 3 + Nano Banana 🍌)
- **Flow 6: Enhanced Flagging System** (Per-conversation flagging)

---

## 🚀 **REMAINING BUILD FLOW (Current Status):**

### **✅ COMPLETED:**
- ✅ Database Foundation (junction table, seed data)
- ✅ AI Provider Infrastructure (Google ✅, Groq ✅, OpenAI ready, Anthropic ready)
- ✅ Admin Interface (`/admin/models` with testing, error display, and Groq support)
- ✅ API Infrastructure (`/api/ai/test`)
- ✅ **BONUS:** Added Groq provider with Llama 3.1 8B Instant (fast and free!)

### **🚧 REMAINING FLOWS:**

### **Flow 1: Build Chat API** ✅ **COMPLETED**
- [x] Create `/api/ai/chat` endpoint
- [x] Connect to working providers (Google ✅ + Groq ✅)
- [x] Test with curl to verify AI responses
- [x] **BONUS:** Added Groq Llama 3.1 support for fast, free responses

### **Flow 2: Build Blind Assignment Logic** ✅ **COMPLETED**
- [x] ✅ Create `getBlindName()` function (Alpha, Beta, Gamma)
- [x] ✅ Create `getModelConfig()` function  
- [x] ✅ Test blind name assignment

### **Flow 3: Enhance Exercise Creation** ✅ **COMPLETED**
- [x] ✅ Update `/admin/exercises` page
- [x] ✅ Add model selection dropdown (multi-select)
- [x] ✅ Add blind name preview
- [x] ✅ Save to `exercise_models` junction table

### **Flow 4: Connect Frontend to Real AI** ✅ **COMPLETED**
- [x] ✅ Update exercise page (`/exercise/[id]`)
- [x] ✅ Replace placeholder responses with real API calls
- [x] ✅ Show conversation per assigned model (Alpha, Beta, etc.)
- [x] ✅ Test full user flow: create exercise → assign models → user chats with AI
- [x] ✅ **BONUS:** Mobile-optimized chatbox with proper containment

### **Flow 5: Add Image Generation** 🎯 **CURRENT PRIORITY**
- [ ] ❌ Create `/api/ai/image` endpoint
- [ ] ❌ Integrate DALL-E 3 + Nano Banana
- [ ] ❌ Add image display to exercise interface

### **Flow 6: Update Flagging System**
- [ ] ❌ Per-conversation flagging (not per response)
- [ ] ❌ Flag each model conversation separately

---

## 🎯 **CURRENT PRIORITY: Flow 5 - Image Generation**

**Status:** Flows 1-4 completed successfully! 80% of Week 7-8 complete. Ready for DALL-E 3 + Nano Banana 🍌 image generation.

---

*Week 7-8 AI Integration - Comprehensive Implementation Plan*  
*Ready for execution starting December 19, 2025* 🚀
