# SOMOS Civic Lab - AI Red-Teaming Platform

> Democratizing AI governance through structured public participation in red teaming exercises.

## 🎉 Project Complete: Week 10 Production Launch ✅

### ✅ Week 10 Production Launch Complete (100%)
- [x] Rate limiting middleware (40 req/min per IP)
- [x] Credits system (per-model cost, live balance updates)
- [x] Security audit (RLS policies, indexes verified)
- [x] Accessibility improvements (aria-labels)
- [x] Lighthouse audit complete (93% perf, 89% accessibility, 100% best practices, 95% SEO)
- [x] Production deployment complete

### ✅ Week 9 Advanced Features Complete (100%)
- [x] Admin flagging analytics dashboard (`/admin/flags`)
- [x] Flag management (view, filter, review, resolve, dismiss)
- [x] Analytics charts (by category, by model, top submitters)
- [x] Data export APIs (flags, interactions, exercises)
- [x] Admin export page with date filtering (`/admin/export`)
- [x] Flag templates for quick submission
- [x] AI conversation context (chat remembers history)
- [x] Multiple categories per flag
- [x] Full conversation stored with flags

### ✅ Week 7-8 AI Integration Complete (100%)
- [x] Multi-provider AI integration (Google Gemini, Groq Llama, OpenAI, Anthropic)
- [x] Blind testing system with Alpha/Beta/Gamma model names
- [x] Enhanced exercise creation with model assignment
- [x] Real AI chatboxes with mobile optimization
- [x] Image generation infrastructure (Nano Banana + DALL-E 3)
- [x] Per-conversation flagging system
- [x] Interactive API documentation (Swagger UI)
- [x] Comprehensive testing and deployment

### ✅ Week 5-6 Exercise System Complete (100%)
- [x] Exercise lifecycle management with scheduling
- [x] Participant assignment system with limits
- [x] Join/leave functionality with validation
- [x] Progress tracking with real-time counts
- [x] RLS-safe participant counting
- [x] Enhanced admin interface

### ✅ Week 3-4 RBAC & Admin Complete (100%)
- [x] Role-based access control (Admin/Participant)
- [x] Admin dashboard with platform statistics
- [x] User management (search, pagination, role toggle, activate/deactivate)
- [x] Exercise management CRUD (create, edit, delete)
- [x] Dynamic exercises loaded from database
- [x] Deactivated user blocking with redirect page
- [x] Dark/light mode persistence (localStorage)
- [x] Search and pagination for admin tables
- [x] Playwright E2E testing setup
- [x] Sentry error monitoring integration
- [x] Snyk security scanning (GitHub integration)

### ✅ Week 1-2 Foundation Complete (100%)
- [x] Next.js 14 + TypeScript + Tailwind CSS initialization  
- [x] Cloudflare Pages deployment (somos.website)
- [x] Complete database schema with 9 production-ready tables
- [x] Row Level Security (RLS) policies implemented
- [x] Email/password authentication system
- [x] Google & GitHub OAuth integration
- [x] User profile system with database integration
- [x] Password reset functionality

## 🚀 Live Demo
- **Production Site:** [somos.website](https://somos.website)
- **Status:** Full AI integration operational with blind testing
- **Features:** Real AI conversations, multi-model comparison, flagging system, analytics

## 🤖 AI Integration Features

### **Supported AI Providers**
- **Google Gemini 2.5 Flash** - Free tier, fast responses
- **Groq Llama 3.1 8B Instant** - Free tier, ultra-fast inference
- **OpenAI GPT-4 & DALL-E 3** - Ready for use (requires API credits)
- **Anthropic Claude 3** - Ready for use (requires API credits)
- **Custom APIs** - Unlimited custom models via Admin UI (OpenAI-compatible endpoints)

### **Blind Testing System**
- Models appear as **Alpha, Beta, Gamma** to users
- System prompts prevent AI identity revelation
- True unbiased comparison methodology
- Junction table tracks model assignments

### **Chat Interface**
- **Single model:** Full-width chatbox
- **Multiple models:** Side-by-side comparison
- **Mobile optimized:** Responsive with scroll isolation
- **Rich formatting:** Markdown, code highlighting, tables
- **Copy functionality:** Message and code block copying
- **Conversation context:** AI remembers chat history

## 🚀 Quick Start

```bash
npm install --legacy-peer-deps
npm run dev
```

### Environment Variables
```bash
# AI Provider API Keys
GOOGLE_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Custom Model API Keys (add as needed)
# MY_CUSTOM_API_KEY=your_custom_api_key
```

## 🔧 Adding Custom AI Models

Custom models can be added via Admin UI without code changes:

1. **Add env var** for API key: `MY_MODEL_KEY=sk-xxx`
2. **Go to Admin** → Manage Models → Add Model
3. **Select provider:** `custom`
4. **Enter endpoint:** `https://your-api.com/v1`
5. **Enter env var name:** `MY_MODEL_KEY`
6. **Save and test** connection

## 🧪 Testing

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Test AI integration
npm run test:ai
```

## 🏗 Week 7-8 Achievements

### **AI Provider Integration** 🤖
- **Multi-provider support:** Google, Groq, OpenAI, Anthropic, Custom
- **Custom model support:** Add unlimited custom models via Admin UI
- **Secure configuration:** API keys in env vars, endpoints in database
- **Environment configuration:** Secure API key management
- **Error handling:** Graceful degradation and retry logic
- **Connection testing:** Admin interface for provider validation

### **Blind Testing System** 🎭
- **Junction table:** `exercise_models` for model assignments
- **Blind names:** Alpha, Beta, Gamma, Delta system
- **Identity protection:** System prompts prevent AI revelation
- **Admin preview:** Real-time blind name assignment preview

### **Enhanced Exercise Creation** 📝
- **Model assignment:** Multi-select with blind name preview
- **Dynamic filtering:** Clean model list (removes test entries)
- **Form validation:** Required field validation with error display
- **Mobile responsive:** Touch-friendly admin interface
- **Database integration:** Proper junction table storage

### **Frontend AI Integration** 💬
- **Real chatboxes:** Replace placeholder with actual AI responses
- **Mobile optimization:** Scroll isolation and containment
- **Multi-model layout:** Side-by-side comparison interface
- **Rich formatting:** Full markdown, code blocks, tables, HTML
- **Copy functionality:** Message and code copying
- **Auto-scroll:** Smooth conversation threading

### **Image Generation Infrastructure** 🖼️
- **API endpoint:** `/api/ai/image` with provider routing
- **Nano Banana:** Google Gemini Vision integration
- **DALL-E 3:** OpenAI image generation ready
- **UI components:** Image display and generation buttons
- **Error handling:** Graceful paid tier requirement handling

### **Enhanced Flagging System** 🚩
- **Per-conversation:** Flag entire conversations, not individual messages
- **Multiple categories:** Harmful content, misinformation, bias, etc.
- **Severity rating:** 1-10 scale with comments
- **Context preservation:** Full conversation saved with flags
- **Blind integrity:** Flags don't reveal model identity

### **API Documentation** 📚
- **Interactive Swagger UI:** Live API testing interface
- **Dynamic model enumeration:** Real-time model list updates
- **Alternative tester:** Dropdown-based API testing tool
- **Provider emojis:** Visual model identification
- **Error display:** Detailed API response information

## 📚 Documentation
Detailed documentation available in [`/docs`](./docs/README.md)

## 🛠 Tech Stack
- **Frontend:** Next.js 16 • TypeScript • Tailwind CSS • Radix UI
- **Backend:** Next.js serverless functions • Supabase
- **Database:** PostgreSQL via Supabase
- **AI Providers:** Google Gemini • Groq • OpenAI • Anthropic
- **Hosting:** Netlify
- **Testing:** Playwright
- **Monitoring:** Sentry
- **Security:** Snyk

## 📊 Progress Overview
| Week | Focus | Status |
|------|-------|--------|
| 1-2 | Foundation & Auth | ✅ 100% Complete |
| 3-4 | RBAC & Admin | ✅ 100% Complete |
| 5-6 | Exercise System | ✅ 100% Complete |
| 7-8 | AI Integration | ✅ 100% Complete |
| 9 | Advanced Features | ✅ 100% Complete |
| 10 | Production Launch | ⏳ Up Next |

---
**Latest Update:** January 1, 2026 - Week 9 complete: Flagging analytics, data export, charts, conversation context
