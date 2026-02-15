-- Add timer settings to exercises table
ALTER TABLE exercises 
  ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS timer_enabled BOOLEAN DEFAULT false;

-- Add timer columns to existing exercise_participation table
ALTER TABLE exercise_participation 
  ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_checkpoint TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS time_expired BOOLEAN DEFAULT false;

-- Add index for timer queries
CREATE INDEX IF NOT EXISTS idx_exercise_participation_timer ON exercise_participation(completed_at, time_expired);

-- Add trigger for updated_at (uses existing function)
CREATE TRIGGER update_exercise_participation_updated_at 
  BEFORE UPDATE ON exercise_participation 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON COLUMN exercises.time_limit_minutes IS 'Time limit in minutes for completing the exercise. NULL = no limit';
COMMENT ON COLUMN exercises.timer_enabled IS 'Whether timer is enabled for this exercise';
COMMENT ON COLUMN exercise_participation.time_spent_seconds IS 'Total time spent in seconds (cumulative across sessions)';
COMMENT ON COLUMN exercise_participation.last_checkpoint IS 'Last time timer was updated';
COMMENT ON COLUMN exercise_participation.time_expired IS 'Whether exercise locked due to time expiry';
