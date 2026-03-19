-- Trigger to handle NO ACTION foreign keys before user deletion
-- CASCADE references (interactions, flags.user_id, team_members, etc.) are handled automatically
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION delete_user_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set NULL on NO ACTION references (these would block deletion)
  UPDATE ai_models SET created_by = NULL WHERE created_by = OLD.id;
  UPDATE exercises SET created_by = NULL WHERE created_by = OLD.id;
  UPDATE exercises SET reviewed_by = NULL WHERE reviewed_by = OLD.id;
  UPDATE flags SET reviewed_by = NULL WHERE reviewed_by = OLD.id;
  UPDATE teams SET created_by = NULL WHERE created_by = OLD.id;
  
  -- CASCADE references are handled automatically by the database:
  -- interactions, flags (user_id), exercise_invites, exercise_participation,
  -- participation_stats, team_members, user_profiles
  
  RETURN OLD;
END;
$$;

-- Attach trigger to users table (runs BEFORE delete)
DROP TRIGGER IF EXISTS trigger_delete_user_data ON users;
CREATE TRIGGER trigger_delete_user_data
  BEFORE DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION delete_user_data();
