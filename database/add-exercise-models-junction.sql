-- Add junction table to link exercises with AI models
-- This enables exercises to use specific AI models with blind names

CREATE TABLE public.exercise_models (
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    model_id UUID REFERENCES public.ai_models(id) ON DELETE CASCADE,
    blind_name VARCHAR(50) NOT NULL, -- 'Alpha', 'Beta', 'Gamma', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (exercise_id, model_id)
);

-- Add indexes for performance
CREATE INDEX idx_exercise_models_exercise_id ON public.exercise_models(exercise_id);
CREATE INDEX idx_exercise_models_model_id ON public.exercise_models(model_id);
CREATE INDEX idx_exercise_models_blind_name ON public.exercise_models(blind_name);

-- Add constraint to ensure unique blind names per exercise
CREATE UNIQUE INDEX idx_exercise_models_unique_blind_name 
ON public.exercise_models(exercise_id, blind_name);

-- Add RLS policy
ALTER TABLE public.exercise_models ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read exercise-model mappings
CREATE POLICY "Allow authenticated users to read exercise models" 
ON public.exercise_models FOR SELECT 
TO authenticated 
USING (true);

-- Only admins can manage exercise-model mappings
CREATE POLICY "Allow admins to manage exercise models" 
ON public.exercise_models FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
    )
);
