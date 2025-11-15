-- SOMOS Civic Lab AI Red-Teaming Platform Database Schema
-- Created for Supabase PostgreSQL
-- Version: 1.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    username VARCHAR(50) UNIQUE,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('admin', 'participant', 'moderator')),
    bio TEXT,
    expertise_areas TEXT[],
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. USER PROFILES TABLE (extended user information)
-- =====================================================
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    organization VARCHAR(255),
    job_title VARCHAR(255),
    location VARCHAR(255),
    website_url TEXT,
    linkedin_url TEXT,
    twitter_handle VARCHAR(50),
    participation_count INTEGER DEFAULT 0,
    flags_submitted INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"email": true, "in_app": true}',
    privacy_settings JSONB DEFAULT '{"profile_public": true, "stats_public": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. AI MODELS TABLE
-- =====================================================
CREATE TABLE public.ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL, -- For blind testing (e.g., "Model Alpha")
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'custom', 'local')),
    model_id VARCHAR(255) NOT NULL, -- Provider-specific model identifier
    version VARCHAR(50),
    description TEXT,
    capabilities TEXT[],
    configuration JSONB DEFAULT '{}', -- Provider-specific config (API keys, endpoints, etc.)
    rate_limits JSONB DEFAULT '{"requests_per_minute": 60, "tokens_per_minute": 10000}',
    cost_per_token DECIMAL(10, 8),
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(provider, model_id, version)
);

-- =====================================================
-- 4. EXERCISES TABLE
-- =====================================================
CREATE TABLE public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    guidelines TEXT NOT NULL,
    instructions JSONB NOT NULL, -- Structured instructions for participants
    configuration JSONB DEFAULT '{}', -- Exercise-specific settings
    target_models UUID[], -- Array of ai_model IDs to test
    max_participants INTEGER,
    estimated_duration INTEGER, -- in minutes
    tags TEXT[],
    created_by UUID REFERENCES public.users(id) NOT NULL,
    reviewed_by UUID REFERENCES public.users(id),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. EXERCISE PARTICIPATION TABLE
-- =====================================================
CREATE TABLE public.exercise_participation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
    progress JSONB DEFAULT '{"interactions": 0, "flags_submitted": 0}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(exercise_id, user_id)
);

-- =====================================================
-- 6. INTERACTIONS TABLE
-- =====================================================
CREATE TABLE public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    model_id UUID REFERENCES public.ai_models(id) ON DELETE CASCADE,
    session_id UUID NOT NULL, -- Groups related interactions
    prompt TEXT NOT NULL,
    response TEXT,
    response_time_ms INTEGER,
    token_count INTEGER,
    metadata JSONB DEFAULT '{}', -- Model-specific metadata, costs, etc.
    context JSONB DEFAULT '{}', -- Exercise context, previous interactions
    quality_score DECIMAL(3, 2), -- 0.00 to 5.00
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    is_flagged BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. FLAGS TABLE (Issue Reporting)
-- =====================================================
CREATE TABLE public.flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID REFERENCES public.interactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'harmful_content', 'misinformation', 'bias_discrimination', 
        'privacy_violation', 'inappropriate_response', 'factual_error', 
        'off_topic', 'spam', 'other'
    )),
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '{}', -- Screenshots, additional context
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES public.users(id),
    reviewer_notes TEXT,
    resolution JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 8. PARTICIPATION STATS TABLE
-- =====================================================
CREATE TABLE public.participation_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    total_interactions INTEGER DEFAULT 0,
    total_flags_submitted INTEGER DEFAULT 0,
    average_session_duration INTEGER, -- in minutes
    completion_rate DECIMAL(5, 2), -- percentage
    quality_score DECIMAL(3, 2), -- average quality score
    engagement_metrics JSONB DEFAULT '{}',
    achievements JSONB DEFAULT '[]', -- Array of earned achievements
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, exercise_id)
);

-- =====================================================
-- 9. SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance Optimization
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_active ON public.users(is_active);

-- AI Models indexes
CREATE INDEX idx_ai_models_provider ON public.ai_models(provider);
CREATE INDEX idx_ai_models_active ON public.ai_models(is_active);
CREATE INDEX idx_ai_models_public ON public.ai_models(is_public);

-- Exercises indexes
CREATE INDEX idx_exercises_status ON public.exercises(status);
CREATE INDEX idx_exercises_category ON public.exercises(category);
CREATE INDEX idx_exercises_created_by ON public.exercises(created_by);
CREATE INDEX idx_exercises_dates ON public.exercises(start_date, end_date);

-- Interactions indexes
CREATE INDEX idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX idx_interactions_exercise_id ON public.interactions(exercise_id);
CREATE INDEX idx_interactions_model_id ON public.interactions(model_id);
CREATE INDEX idx_interactions_session_id ON public.interactions(session_id);
CREATE INDEX idx_interactions_created_at ON public.interactions(created_at);
CREATE INDEX idx_interactions_flagged ON public.interactions(is_flagged);

-- Flags indexes
CREATE INDEX idx_flags_status ON public.flags(status);
CREATE INDEX idx_flags_category ON public.flags(category);
CREATE INDEX idx_flags_severity ON public.flags(severity);
CREATE INDEX idx_flags_user_id ON public.flags(user_id);
CREATE INDEX idx_flags_created_at ON public.flags(created_at);

-- =====================================================
-- TRIGGERS for Updated_at timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON public.ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_participation_stats_updated_at BEFORE UPDATE ON public.participation_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
