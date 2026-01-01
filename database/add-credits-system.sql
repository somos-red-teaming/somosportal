-- Credits System Migration
-- Run in Supabase SQL Editor

-- Add credits to users (default 100 messages)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 100;

-- Add credit cost to models (0 = free, 1+ = costs credits)
ALTER TABLE public.ai_models ADD COLUMN IF NOT EXISTS credit_cost INTEGER DEFAULT 0;

-- Index for quick credit checks
CREATE INDEX IF NOT EXISTS idx_users_credits ON public.users(credits);
