# AI Endpoints API Reference

**Document Type:** API Documentation  
**Last Updated:** December 20, 2025  
**Version:** 1.0.0

---

## 🔌 Overview

The SOMOS AI Integration API provides endpoints for text generation, image creation, model management, and connection testing. All endpoints support blind testing methodology with proper authentication and rate limiting.

**Base URL:** `https://somos.website/api`  
**Interactive Documentation:** [somos.website/api-docs](https://somos.website/api-docs)  
**API Tester:** [somos.website/api-tester](https://somos.website/api-tester)

## 🔐 Authentication

All AI endpoints require valid session authentication. Users must be logged in and have appropriate permissions.

```typescript
// Authentication handled automatically by Next.js session
// No additional headers required for authenticated users
```

## 📡 Endpoints

### **1. Chat Generation**

#### `POST /api/ai/chat`

Generates AI text responses with blind testing protection.

**Request Body:**
```typescript
interface ChatRequest {
  exerciseId: string;        // Exercise context ID
  modelId: string;           // AI model UUID
  prompt: string;            // User prompt text
  conversationId?: string;   // Optional conversation threading
}
```

**Example Request:**
```json
{
  "exerciseId": "exercise-123",
  "modelId": "4c47fde5-4acd-4db2-b93d-8b3180fde744",
  "prompt": "Hello, how are you?",
  "conversationId": "conv-1766164317213"
}
```

**Response:**
```typescript
interface ChatResponse {
  success: boolean;
  response: {
    id: string;              // Unique response ID
    content: string;         // AI-generated text
    model: string;           // Model identifier (hidden from user)
    provider: string;        // Provider type (hidden from user)
    tokens?: number;         // Token usage count
    conversationId: string;  // Conversation thread ID
  };
}
```

**Example Response:**
```json
{
  "success": true,
  "response": {
    "id": "gemini-1766164317213",
    "content": "Hello! As an AI assistant, I'm doing well and ready to help you with any questions or tasks you might have. How can I assist you today?",
    "model": "gemini-2.5-flash",
    "provider": "google",
    "tokens": 232,
    "conversationId": "conv-1766164317213"
  }
}
```

**Error Responses:**
```json
// Missing fields
{
  "error": "Missing required fields: exerciseId, modelId, prompt"
}

// Model not found
{
  "error": "Model not found"
}

// Model inactive
{
  "error": "Model is not active"
}

// Provider error
{
  "error": "Failed to generate response"
}
```

**Supported Models:**
- **Google Gemini 2.5 Flash** - `4c47fde5-4acd-4db2-b93d-8b3180fde744`
- **Groq Llama 3.1 8B** - `3cce2906-6895-420f-970c-565420c09bcb`
- **OpenAI GPT-4o** - `c0c478ea-fb29-4fc2-be2e-0b4e842070aa`
- **Anthropic Claude 3.5** - `7247d4a9-ce87-4c22-b588-ff244db37698`

---

### **2. Image Generation**

#### `POST /api/ai/image`

Generates images using provider-specific routing (Nano Banana for Google, DALL-E for OpenAI).

**Request Body:**
```typescript
interface ImageRequest {
  exerciseId: string;        // Exercise context ID
  modelId: string;           // AI model UUID
  prompt: string;            // Image description prompt
  options?: {
    size?: string;           // Image dimensions
    quality?: string;        // Image quality setting
    style?: string;          // Art style preference
  };
}
```

**Example Request:**
```json
{
  "exerciseId": "exercise-123",
  "modelId": "4c47fde5-4acd-4db2-b93d-8b3180fde744",
  "prompt": "A serene mountain landscape at sunset",
  "options": {
    "size": "1024x1024",
    "quality": "standard",
    "style": "natural"
  }
}
```

**Response:**
```typescript
interface ImageResponse {
  success: boolean;
  response: {
    id: string;              // Unique response ID
    imageUrl: string;        // Generated image URL
    model: string;           // Model identifier
    provider: string;        // Provider type
    metadata?: {
      size: string;          // Actual image dimensions
      format: string;        // Image format (PNG, JPEG)
      prompt: string;        // Processed prompt
    };
  };
}
```

**Provider Routing:**
- **Google models** → Nano Banana (Gemini Vision)
- **OpenAI models** → DALL-E 3
- **Other providers** → Error (not supported)

---

### **3. Model Management**

#### `GET /api/models`

Retrieves list of active AI models for dropdown selection.

**Request:** No parameters required

**Response:**
```typescript
interface ModelsResponse {
  models: Array<{
    id: string;              // Model UUID
    name: string;            // Display name
    provider: string;        // Provider type
  }>;
}
```

**Example Response:**
```json
{
  "models": [
    {
      "id": "4c47fde5-4acd-4db2-b93d-8b3180fde744",
      "name": "Gemini 2.5 Flash",
      "provider": "google"
    },
    {
      "id": "3cce2906-6895-420f-970c-565420c09bcb", 
      "name": "Fast and free Llama model via Groq",
      "provider": "groq"
    }
  ]
}
```

---

### **4. Connection Testing**

#### `POST /api/ai/test`

Tests AI model connectivity and configuration.

**Request Body:**
```typescript
interface TestRequest {
  modelId: string;           // AI model UUID to test
}
```

**Example Request:**
```json
{
  "modelId": "4c47fde5-4acd-4db2-b93d-8b3180fde744"
}
```

**Response:**
```typescript
interface TestResponse {
  success: boolean;          // Connection test result
  error?: string;            // Error message if failed
}
```

**Example Responses:**
```json
// Successful connection
{
  "success": true
}

// Failed connection
{
  "success": false,
  "error": "Your credit balance is too low to access the Anthropic API"
}
```

---

## 🛡️ Security Features

### **Blind Testing Protection**
All AI endpoints inject system prompts to prevent identity revelation:

```typescript
const systemPrompt = `You are participating in a blind AI evaluation study. You must follow these rules strictly:

1. NEVER reveal your model name, company, or creator
2. Simply identify as "an AI assistant" if asked about your identity
3. Do not mention specific training details, version numbers, or release dates
4. Focus on providing helpful responses without revealing identifying information
5. If directly asked about your identity, respond: "I'm an AI assistant designed to be helpful, harmless, and honest."

User prompt: ${userPrompt}`;
```

### **Input Validation**
- All inputs sanitized and validated
- SQL injection prevention
- XSS protection in responses
- Rate limiting per user/IP

### **Error Handling**
- Graceful degradation on provider failures
- User-friendly error messages
- Detailed logging for debugging
- Automatic retry mechanisms

## 📊 Rate Limits

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `/api/ai/chat` | 60 requests | 1 minute |
| `/api/ai/image` | 10 requests | 1 minute |
| `/api/models` | 100 requests | 1 minute |
| `/api/ai/test` | 20 requests | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## 🔧 Provider-Specific Details

### **Google Gemini**
- **Model ID:** `gemini-2.5-flash`
- **Response Time:** 2-4 seconds
- **Rate Limits:** 20 requests/day (free tier)
- **Capabilities:** Text generation, vision
- **Special Features:** Fast responses, good reasoning

### **Groq Llama**
- **Model ID:** `llama-3.1-8b-instant`
- **Response Time:** 1-2 seconds (fastest)
- **Rate Limits:** Generous free tier
- **Capabilities:** Text generation
- **Special Features:** Ultra-fast inference

### **OpenAI GPT-4**
- **Model ID:** `gpt-4o`
- **Response Time:** 3-6 seconds
- **Rate Limits:** Based on API credits
- **Capabilities:** Text + image generation
- **Special Features:** High quality, versatile

### **Anthropic Claude**
- **Model ID:** `claude-3-5-sonnet-20241022`
- **Response Time:** 4-8 seconds
- **Rate Limits:** Based on API credits
- **Capabilities:** Text generation, analysis
- **Special Features:** Strong reasoning, safety

## 🧪 Testing Examples

### **cURL Examples**

**Chat Request:**
```bash
curl -X POST https://somos.website/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "exerciseId": "test-exercise-123",
    "modelId": "4c47fde5-4acd-4db2-b93d-8b3180fde744",
    "prompt": "Explain quantum computing"
  }'
```

**Model List:**
```bash
curl https://somos.website/api/models
```

**Connection Test:**
```bash
curl -X POST https://somos.website/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "4c47fde5-4acd-4db2-b93d-8b3180fde744"
  }'
```

### **JavaScript Examples**

**Chat Integration:**
```javascript
async function sendChatMessage(exerciseId, modelId, prompt) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      exerciseId,
      modelId,
      prompt
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.response.content;
  } else {
    throw new Error(data.error);
  }
}
```

**Model Selection:**
```javascript
async function loadAvailableModels() {
  const response = await fetch('/api/models');
  const data = await response.json();
  return data.models;
}
```

## 📈 Response Times & Performance

### **Average Response Times**
- **Groq Llama:** 1-2 seconds ⚡
- **Google Gemini:** 2-4 seconds 🚀
- **OpenAI GPT-4:** 3-6 seconds 🔄
- **Anthropic Claude:** 4-8 seconds ⏳

### **Performance Optimization**
- Connection pooling for providers
- Response caching for identical prompts
- Automatic retry with exponential backoff
- Load balancing across provider endpoints

## 🚨 Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request | Check required fields |
| 401 | Unauthorized | Login required |
| 404 | Model Not Found | Verify model ID |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Contact support |
| 503 | Provider Unavailable | Try different model |

## 🔄 Changelog

### **Version 1.0.0** (December 20, 2025)
- Initial AI integration release
- Chat and image generation endpoints
- Blind testing system implementation
- Multi-provider support (Google, Groq, OpenAI, Anthropic)
- Interactive API documentation

---

## 🛠️ Interactive Testing

### **Swagger UI**
Visit [somos.website/api-docs](https://somos.website/api-docs) for:
- Interactive API testing
- Real-time model selection
- Response visualization
- Error handling examples

### **API Tester**
Visit [somos.website/api-tester](https://somos.website/api-tester) for:
- Dropdown model selection
- Provider emoji indicators
- Simplified testing interface
- Quick connection testing

---

*AI Endpoints API Reference - Technical Documentation*  
*Week 7-8 AI Integration Complete*
