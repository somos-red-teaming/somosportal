-- First, remove the unique constraint if it exists
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_unique;

-- Delete duplicates, keeping only the most recent one for each user_id
DELETE FROM user_profiles 
WHERE id NOT IN (
    SELECT id FROM (
        SELECT DISTINCT ON (user_id) id
        FROM user_profiles 
        ORDER BY user_id, created_at DESC
    ) t
);

-- Now add the unique constraint
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
