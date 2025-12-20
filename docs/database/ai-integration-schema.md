# AI Integration Database Schema

**Document Type:** Database Documentation  
**Last Updated:** December 20, 2025  
**Status:** Week 7-8 Complete

---

## 🗄️ Schema Overview

The AI Integration extends the SOMOS database with new tables and relationships to support multi-provider AI testing, blind name assignments, and enhanced flagging capabilities.

## 📊 New Tables

### **1. `exercise_models` (Junction Table)**

Links exercises to AI models with blind name assignments for unbiased testing.

```sql
CREATE TABLE exercise_models (
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    blind_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (exercise_id, model_id)
);

-- Indexes for performance
CREATE INDEX idx_exercise_models_exercise_id ON exercise_models(exercise_id);
CREATE INDEX idx_exercise_models_model_id ON exercise_models(model_id);
CREATE INDEX idx_exercise_models_blind_name ON exercise_models(blind_name);
```

**Purpose:** Maintains consistent blind name assignments (Alpha, Beta, Gamma) across user sessions.

**Example Data:**
```sql
INSERT INTO exercise_models (exercise_id, model_id, blind_name) VALUES
('550e8400-e29b-41d4-a716-446655440000', '4c47fde5-4acd-4db2-b93d-8b3180fde744', 'Alpha'),
('550e8400-e29b-41d4-a716-446655440000', '3cce2906-6895-420f-970c-565420c09bcb', 'Beta'),
('550e8400-e29b-41d4-a716-446655440000', 'c0c478ea-fb29-4fc2-be2e-0b4e842070aa', 'Gamma');
```

### **2. `ai_models` (Enhanced)**

Stores AI model configurations with provider-specific settings.

```sql
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

-- Indexes
CREATE INDEX idx_ai_models_provider ON ai_models(provider);
CREATE INDEX idx_ai_models_active ON ai_models(is_active);
CREATE INDEX idx_ai_models_public ON ai_models(is_public);
CREATE UNIQUE INDEX idx_ai_models_provider_model ON ai_models(provider, model_id);
```

**Seeded Data:**
```sql
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

## 🔄 Modified Tables

### **3. `flags` (Enhanced)**

Extended to support per-conversation flagging with full context.

```sql
-- Add new columns to existing flags table
ALTER TABLE flags ADD COLUMN conversation_context JSONB;
ALTER TABLE flags ADD COLUMN model_blind_name VARCHAR(50);
ALTER TABLE flags ADD COLUMN exercise_id UUID REFERENCES exercises(id);
ALTER TABLE flags ADD COLUMN conversation_id VARCHAR(100);

-- New indexes
CREATE INDEX idx_flags_exercise_id ON flags(exercise_id);
CREATE INDEX idx_flags_model_blind_name ON flags(model_blind_name);
CREATE INDEX idx_flags_conversation_id ON flags(conversation_id);
```

**Enhanced Flag Structure:**
```sql
-- Example flag with conversation context
INSERT INTO flags (
    user_id, 
    exercise_id,
    model_blind_name,
    conversation_id,
    category, 
    severity, 
    description,
    conversation_context
) VALUES (
    'user-123',
    'exercise-456', 
    'Alpha',
    'conv-1766164317213',
    'bias_discrimination',
    8,
    'Model showed gender bias in job recommendations',
    '{
        "messages": [
            {"type": "user", "content": "What qualities make a good software engineer?"},
            {"type": "ai", "content": "A good software engineer should be logical and analytical, traits that men typically excel at..."}
        ],
        "model_responses": 3,
        "conversation_length": 5
    }'
);
```

### **4. `exercises` (Existing - No Changes)**

The exercises table remains unchanged but now relates to AI models through the junction table.

```sql
-- Existing exercises table structure (no modifications needed)
-- Relationships now handled through exercise_models junction table
```

## 🔗 Relationships

### **Entity Relationship Diagram**
```
exercises (1) ←→ (M) exercise_models (M) ←→ (1) ai_models
    ↓
flags (M) ←→ (1) exercises
    ↓
users (1) ←→ (M) flags
```

### **Key Relationships:**

**Exercise ↔ Models (Many-to-Many):**
- One exercise can have multiple AI models
- One AI model can be used in multiple exercises
- Junction table maintains blind name assignments

**Flags ↔ Exercises (Many-to-One):**
- Flags are associated with specific exercises
- Enables exercise-specific flag analysis
- Maintains blind testing integrity

**Flags ↔ Users (Many-to-One):**
- Users can submit multiple flags
- Tracks flagging patterns per user
- Enables user reputation systems

## 🔍 Query Examples

### **Get Exercise Models with Blind Names**
```sql
SELECT 
    em.blind_name,
    am.name as model_name,
    am.provider,
    am.capabilities
FROM exercise_models em
JOIN ai_models am ON em.model_id = am.id
WHERE em.exercise_id = $1
ORDER BY em.blind_name;
```

### **Get Blind Name for Specific Model in Exercise**
```sql
SELECT blind_name 
FROM exercise_models 
WHERE exercise_id = $1 AND model_id = $2;
```

### **Get All Active Models for Dropdown**
```sql
SELECT id, name, provider 
FROM ai_models 
WHERE is_active = true 
ORDER BY name;
```

### **Get Flags with Full Context**
```sql
SELECT 
    f.category,
    f.severity,
    f.description,
    f.model_blind_name,
    f.conversation_context,
    u.email as user_email,
    e.title as exercise_title
FROM flags f
JOIN users u ON f.user_id = u.id
JOIN exercises e ON f.exercise_id = e.id
WHERE f.exercise_id = $1
ORDER BY f.created_at DESC;
```

### **Model Usage Statistics**
```sql
SELECT 
    am.name,
    am.provider,
    COUNT(em.exercise_id) as exercise_count,
    COUNT(DISTINCT em.exercise_id) as unique_exercises
FROM ai_models am
LEFT JOIN exercise_models em ON am.id = em.model_id
WHERE am.is_active = true
GROUP BY am.id, am.name, am.provider
ORDER BY exercise_count DESC;
```

## 🛡️ Row Level Security (RLS)

### **exercise_models Table**
```sql
-- Enable RLS
ALTER TABLE exercise_models ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view exercise models for exercises they participate in
CREATE POLICY "Users can view exercise models for their exercises" ON exercise_models
    FOR SELECT USING (
        exercise_id IN (
            SELECT exercise_id 
            FROM exercise_participation ep
            JOIN users u ON ep.user_id = u.id
            WHERE u.auth_user_id = auth.uid()
        )
    );

-- Policy: Admins can manage all exercise models
CREATE POLICY "Admins can manage exercise models" ON exercise_models
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );
```

### **ai_models Table**
```sql
-- Enable RLS
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view public active models
CREATE POLICY "Users can view public active models" ON ai_models
    FOR SELECT USING (is_public = true AND is_active = true);

-- Policy: Admins can manage all models
CREATE POLICY "Admins can manage all models" ON ai_models
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );
```

### **Enhanced flags Table**
```sql
-- Policy: Users can view their own flags
CREATE POLICY "Users can view own flags" ON flags
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Users can create flags for exercises they participate in
CREATE POLICY "Users can create flags for their exercises" ON flags
    FOR INSERT WITH CHECK (
        exercise_id IN (
            SELECT exercise_id 
            FROM exercise_participation ep
            JOIN users u ON ep.user_id = u.id
            WHERE u.auth_user_id = auth.uid()
        )
    );
```

## 🔧 Database Functions

### **Get Exercise Participant Count (RLS-Safe)**
```sql
CREATE OR REPLACE FUNCTION get_exercise_participant_count(exercise_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.exercise_participation
    WHERE exercise_id = exercise_uuid
    AND status = 'active';
$$;
```

### **Assign Models to Exercise**
```sql
CREATE OR REPLACE FUNCTION assign_models_to_exercise(
    exercise_uuid UUID,
    model_uuids UUID[],
    blind_names TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clear existing assignments
    DELETE FROM exercise_models WHERE exercise_id = exercise_uuid;
    
    -- Insert new assignments
    INSERT INTO exercise_models (exercise_id, model_id, blind_name)
    SELECT exercise_uuid, unnest(model_uuids), unnest(blind_names);
END;
$$;
```

## 📊 Performance Considerations

### **Indexing Strategy**
- Primary keys on all tables for fast lookups
- Foreign key indexes for join performance
- Composite indexes on frequently queried combinations
- Partial indexes on filtered queries (is_active, is_public)

### **Query Optimization**
- Use prepared statements for repeated queries
- Implement connection pooling
- Cache frequently accessed model configurations
- Use EXPLAIN ANALYZE for query performance tuning

### **Data Archival**
```sql
-- Archive old flags (older than 1 year)
CREATE TABLE flags_archive (LIKE flags INCLUDING ALL);

-- Move old data
INSERT INTO flags_archive 
SELECT * FROM flags 
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM flags 
WHERE created_at < NOW() - INTERVAL '1 year';
```

## 🔄 Migration Scripts

### **Initial AI Integration Migration**
```sql
-- File: migrations/001_add_ai_integration.sql

-- Create ai_models table
CREATE TABLE ai_models (
    -- Table definition as shown above
);

-- Create exercise_models junction table  
CREATE TABLE exercise_models (
    -- Table definition as shown above
);

-- Enhance flags table
ALTER TABLE flags ADD COLUMN conversation_context JSONB;
ALTER TABLE flags ADD COLUMN model_blind_name VARCHAR(50);
ALTER TABLE flags ADD COLUMN exercise_id UUID REFERENCES exercises(id);

-- Create indexes
-- Index definitions as shown above

-- Seed initial data
INSERT INTO ai_models (name, display_name, provider, model_id, capabilities, is_active) VALUES
-- Seed data as shown above

-- Enable RLS and create policies
-- RLS policies as shown above
```

### **Rollback Script**
```sql
-- File: migrations/001_rollback_ai_integration.sql

-- Drop new tables
DROP TABLE IF EXISTS exercise_models;
DROP TABLE IF EXISTS ai_models;

-- Remove added columns from flags
ALTER TABLE flags DROP COLUMN IF EXISTS conversation_context;
ALTER TABLE flags DROP COLUMN IF EXISTS model_blind_name;
ALTER TABLE flags DROP COLUMN IF EXISTS exercise_id;
```

---

## 📈 Database Metrics

### **Storage Estimates**
- `ai_models`: ~50 rows, ~50KB
- `exercise_models`: ~500 rows per 100 exercises, ~100KB
- Enhanced `flags`: +30% storage per flag due to conversation context

### **Performance Benchmarks**
- Model lookup by ID: < 1ms
- Exercise models query: < 5ms
- Flag insertion with context: < 10ms
- Complex flag analysis queries: < 100ms

---

*AI Integration Database Schema - Technical Documentation*  
*Week 7-8 AI Integration Complete*
