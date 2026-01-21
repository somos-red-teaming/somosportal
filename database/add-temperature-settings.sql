-- Add temperature to ai_models table (default per model)
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7;

-- Add temperature_override to exercise_models junction table
ALTER TABLE exercise_models ADD COLUMN IF NOT EXISTS temperature_override DECIMAL(3,2) DEFAULT NULL;

-- Comment explaining usage
COMMENT ON COLUMN ai_models.temperature IS 'Default temperature for this model (0.0-2.0)';
COMMENT ON COLUMN exercise_models.temperature_override IS 'Optional temperature override for this model in this exercise. NULL = use model default';
