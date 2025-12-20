-- Add Groq provider to ai_models table constraint
-- Run this in Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE public.ai_models DROP CONSTRAINT IF EXISTS ai_models_provider_check;

-- Add new constraint with groq included
ALTER TABLE public.ai_models ADD CONSTRAINT ai_models_provider_check 
CHECK (provider IN ('openai', 'anthropic', 'google', 'custom', 'local', 'groq'));
