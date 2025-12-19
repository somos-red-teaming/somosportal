-- Clean up duplicate AI models
-- Keep the newer entries (higher created_at) and remove older duplicates

-- First, let's see what duplicates we have
SELECT name, provider, COUNT(*) as count
FROM ai_models 
GROUP BY name, provider 
HAVING COUNT(*) > 1
ORDER BY name;

-- Delete older duplicates, keeping the most recent entry for each name+provider combination
DELETE FROM ai_models 
WHERE id NOT IN (
    SELECT DISTINCT ON (name, provider) id
    FROM ai_models 
    ORDER BY name, provider, created_at DESC
);

-- Verify cleanup - should show no duplicates
SELECT name, provider, COUNT(*) as count
FROM ai_models 
GROUP BY name, provider 
HAVING COUNT(*) > 1;
