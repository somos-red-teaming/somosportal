-- Add INSERT policy for exercise_participation
-- Users can join exercises (insert their own participation records)

CREATE POLICY "Users can join exercises" ON exercise_participation
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);
