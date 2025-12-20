# AI Integration Deployment Setup

**Document Type:** Deployment Guide  
**Last Updated:** December 20, 2025  
**Status:** Week 7-8 Complete

---

## 🚀 Deployment Overview

This guide covers deploying the SOMOS AI Integration to production with proper environment configuration, database migrations, and monitoring setup.

**Live Platform:** [somos.website](https://somos.website)  
**Deployment Platform:** Netlify  
**Database:** Supabase (PostgreSQL)  
**Monitoring:** Sentry

## 🔧 Environment Configuration

### **Required Environment Variables**

#### **AI Provider API Keys**
```bash
# Google AI (Gemini)
GOOGLE_API_KEY=your_google_api_key_here

# Groq (Llama)
GROQ_API_KEY=your_groq_api_key_here

# OpenAI (GPT-4, DALL-E)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

#### **Custom API Configuration (Optional)**
```bash
# Custom AI Provider
CUSTOM_ENDPOINT=https://your-custom-api.com/v1
CUSTOM_API_KEY=your_custom_api_key
CUSTOM_HEADERS={"Authorization": "Bearer token", "X-API-Version": "2024-01"}
```

#### **Database Configuration**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### **Application Configuration**
```bash
# Next.js Configuration
NEXTAUTH_URL=https://somos.website
NEXTAUTH_SECRET=your_nextauth_secret

# Sentry Monitoring
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
```

### **Environment Variable Setup**

#### **Local Development (.env.local)**
```bash
# Copy from .env.example
cp .env.example .env.local

# Edit with your actual values
nano .env.local
```

#### **Netlify Production**
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add each variable individually:
   - **Key:** `GOOGLE_API_KEY`
   - **Value:** `your_actual_api_key`
   - **Scopes:** All deploy contexts

#### **Vercel Alternative**
```bash
# Using Vercel CLI
vercel env add GOOGLE_API_KEY
vercel env add GROQ_API_KEY
vercel env add OPENAI_API_KEY
vercel env add ANTHROPIC_API_KEY
```

## 🗄️ Database Deployment

### **Migration Scripts**

#### **1. AI Integration Schema**
```sql
-- File: database/migrations/001_ai_integration.sql

-- Create ai_models table
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'groq', 'custom')),
    model_id VARCHAR(100) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    description TEXT,
    capabilities TEXT[] DEFAULT ARRAY['text_generation'],
    configuration JSONB DEFAULT '{}',
    rate_limits JSONB DEFAULT '{"tokens_per_minute": 10000, "requests_per_minute": 60}',
    cost_per_token DECIMAL(10,8),
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exercise_models junction table
CREATE TABLE exercise_models (
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    blind_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (exercise_id, model_id)
);

-- Enhance flags table
ALTER TABLE flags ADD COLUMN conversation_context JSONB;
ALTER TABLE flags ADD COLUMN model_blind_name VARCHAR(50);
ALTER TABLE flags ADD COLUMN exercise_id UUID REFERENCES exercises(id);
ALTER TABLE flags ADD COLUMN conversation_id VARCHAR(100);

-- Create indexes
CREATE INDEX idx_ai_models_provider ON ai_models(provider);
CREATE INDEX idx_ai_models_active ON ai_models(is_active);
CREATE INDEX idx_exercise_models_exercise_id ON exercise_models(exercise_id);
CREATE INDEX idx_exercise_models_model_id ON exercise_models(model_id);
CREATE INDEX idx_flags_exercise_id ON flags(exercise_id);
CREATE INDEX idx_flags_model_blind_name ON flags(model_blind_name);
```

#### **2. Seed AI Models**
```sql
-- File: database/migrations/002_seed_ai_models.sql

INSERT INTO ai_models (name, display_name, provider, model_id, description, capabilities, is_active) VALUES
-- Google Models
('Gemini 2.5 Flash', 'Google Gemini 2.5 Flash', 'google', 'gemini-2.5-flash', 'Google''s current fast model', ARRAY['text_generation', 'reasoning', 'conversation'], true),

-- Groq Models  
('Llama 3.1 8B Instant', 'Groq Llama 3.1 8B Instant', 'groq', 'llama-3.1-8b-instant', 'Fast and free Llama model via Groq', ARRAY['text_generation'], true),

-- OpenAI Models
('GPT-4o', 'OpenAI GPT-4o', 'openai', 'gpt-4o', 'OpenAI''s latest multimodal model', ARRAY['text_generation', 'reasoning'], true),
('DALL-E 3', 'OpenAI DALL-E 3', 'openai', 'dall-e-3', 'Advanced image generation model', ARRAY['image_generation', 'creative_art'], true),

-- Anthropic Models
('Claude 3.5 Sonnet', 'Anthropic Claude 3.5 Sonnet', 'anthropic', 'claude-3-5-sonnet-20241022', 'Latest Claude model with enhanced capabilities', ARRAY['text_generation', 'analysis', 'reasoning'], true);
```

#### **3. Row Level Security**
```sql
-- File: database/migrations/003_ai_rls_policies.sql

-- Enable RLS on new tables
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_models ENABLE ROW LEVEL SECURITY;

-- ai_models policies
CREATE POLICY "Users can view public active models" ON ai_models
    FOR SELECT USING (is_public = true AND is_active = true);

CREATE POLICY "Admins can manage all models" ON ai_models
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- exercise_models policies
CREATE POLICY "Users can view exercise models for their exercises" ON exercise_models
    FOR SELECT USING (
        exercise_id IN (
            SELECT exercise_id 
            FROM exercise_participation ep
            JOIN users u ON ep.user_id = u.id
            WHERE u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage exercise models" ON exercise_models
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );
```

### **Running Migrations**

#### **Supabase Dashboard Method**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste each migration script
3. Execute in order (001, 002, 003)
4. Verify tables created successfully

#### **CLI Method**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## 🌐 Netlify Deployment

### **Build Configuration**

#### **netlify.toml**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NEXT_PRIVATE_TARGET = "server"
  NODE_VERSION = "18"

# Redirect rules for API routes
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/___netlify-handler"
  status = 200

# SPA fallback for client-side routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["admin"]}

# Headers for security
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

#### **next.config.mjs**
```javascript
import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  hideSourceMaps: true,
  disableLogger: true,
})
```

### **Deployment Process**

#### **Automatic Deployment (Recommended)**
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Configure environment variables
5. Deploy automatically on git push

#### **Manual Deployment**
```bash
# Build the application
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod --dir=.next
```

### **Domain Configuration**

#### **Custom Domain Setup**
1. Netlify Dashboard → Domain Settings
2. Add custom domain: `somos.website`
3. Configure DNS records:
   ```
   Type: CNAME
   Name: www
   Value: your-site.netlify.app
   
   Type: A
   Name: @
   Value: 75.2.60.5
   ```
4. Enable HTTPS (automatic with Let's Encrypt)

## 🔍 Monitoring & Logging

### **Sentry Configuration**

#### **sentry.server.config.ts**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
})
```

#### **sentry.client.config.ts**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

### **Application Monitoring**

#### **Health Check Endpoint**
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) throw error

    // Test AI providers
    const providers = ['google', 'groq']
    const providerStatus = {}

    for (const provider of providers) {
      try {
        // Test provider connection
        providerStatus[provider] = 'healthy'
      } catch {
        providerStatus[provider] = 'unhealthy'
      }
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      providers: providerStatus
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 })
  }
}
```

#### **Performance Monitoring**
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

export function trackAIResponse(provider: string, responseTime: number, success: boolean) {
  Sentry.addBreadcrumb({
    category: 'ai-provider',
    message: `${provider} response`,
    level: success ? 'info' : 'error',
    data: {
      provider,
      responseTime,
      success
    }
  })

  // Track performance metrics
  if (typeof window !== 'undefined') {
    performance.mark(`ai-${provider}-end`)
    performance.measure(`ai-${provider}`, `ai-${provider}-start`, `ai-${provider}-end`)
  }
}
```

## 🔒 Security Configuration

### **API Security**

#### **Rate Limiting**
```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server'

const rateLimits = new Map()

export function rateLimit(request: NextRequest, limit: number = 60, window: number = 60000) {
  const ip = request.ip || 'anonymous'
  const now = Date.now()
  const windowStart = now - window

  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, [])
  }

  const requests = rateLimits.get(ip).filter((time: number) => time > windowStart)
  
  if (requests.length >= limit) {
    return false
  }

  requests.push(now)
  rateLimits.set(ip, requests)
  return true
}
```

#### **Input Validation**
```typescript
// lib/validation.ts
import { z } from 'zod'

export const chatRequestSchema = z.object({
  exerciseId: z.string().uuid(),
  modelId: z.string().uuid(),
  prompt: z.string().min(1).max(4000),
  conversationId: z.string().optional()
})

export function validateChatRequest(data: unknown) {
  return chatRequestSchema.safeParse(data)
}
```

### **Environment Security**

#### **Secrets Management**
```bash
# Use environment-specific secrets
# Never commit API keys to git
# Rotate keys regularly
# Use least-privilege access

# Example: Rotate Google API key
gcloud auth application-default login
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/aiplatform.user"
```

## 📊 Performance Optimization

### **Caching Strategy**

#### **API Response Caching**
```typescript
// lib/cache.ts
const responseCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function getCachedResponse(key: string) {
  const cached = responseCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

export function setCachedResponse(key: string, data: any) {
  responseCache.set(key, { data, timestamp: Date.now() })
}
```

#### **Database Connection Pooling**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-my-custom-header': 'somos-ai-platform' },
  },
})
```

## 🧪 Testing in Production

### **Smoke Tests**
```bash
#!/bin/bash
# File: scripts/smoke-test.sh

BASE_URL="https://somos.website"

echo "Running smoke tests..."

# Test health endpoint
curl -f "$BASE_URL/api/health" || exit 1

# Test models endpoint
curl -f "$BASE_URL/api/models" || exit 1

# Test main page
curl -f "$BASE_URL" || exit 1

echo "All smoke tests passed!"
```

### **Load Testing**
```javascript
// File: tests/load-test.js
import http from 'k6/http'
import { check } from 'k6'

export let options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 10 },
    { duration: '2m', target: 0 },
  ],
}

export default function () {
  let response = http.get('https://somos.website/api/models')
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
}
```

## 📋 Deployment Checklist

### **Pre-Deployment**
- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] API keys validated and working
- [ ] Build process successful locally
- [ ] Tests passing
- [ ] Security scan completed

### **Deployment**
- [ ] Database migrations applied
- [ ] Environment variables set in Netlify
- [ ] Build and deploy successful
- [ ] Health check endpoint responding
- [ ] AI providers tested and working
- [ ] Domain and SSL configured

### **Post-Deployment**
- [ ] Smoke tests passed
- [ ] Monitoring alerts configured
- [ ] Performance metrics baseline established
- [ ] Error tracking operational
- [ ] Backup procedures verified
- [ ] Documentation updated

---

## 🆘 Troubleshooting

### **Common Deployment Issues**

**Build Failures:**
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check
```

**Environment Variable Issues:**
```bash
# Verify variables are set
echo $GOOGLE_API_KEY
echo $NEXT_PUBLIC_SUPABASE_URL

# Test API connections
curl -H "Authorization: Bearer $GOOGLE_API_KEY" \
  "https://generativelanguage.googleapis.com/v1beta/models"
```

**Database Connection Issues:**
```sql
-- Test database connection
SELECT NOW();

-- Check table existence
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'ai_models';
```

---

*AI Integration Deployment Setup - Technical Guide*  
*Week 7-8 AI Integration Complete*
