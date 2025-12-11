-- Create a function to count exercise participants that bypasses RLS
-- This allows all users to see participant counts without exposing individual participation data

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_exercise_participant_count(UUID) TO authenticated;
