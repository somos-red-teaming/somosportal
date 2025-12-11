-- Check if unique constraint exists
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'user_profiles'::regclass;

-- If the constraint doesn't exist, add it
-- (Run this only if the above query shows no unique constraint on user_id)
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
