-- Create SQL function for flag statistics aggregation
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_flag_statistics()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
  status_counts jsonb;
  severity_counts jsonb;
  category_data jsonb;
  model_data jsonb;
  user_data jsonb;
BEGIN
  -- Status counts
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'under_review', COUNT(*) FILTER (WHERE status = 'under_review'),
    'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
    'dismissed', COUNT(*) FILTER (WHERE status = 'dismissed')
  ) INTO status_counts
  FROM flags;

  -- Severity counts
  SELECT jsonb_build_object(
    'high', COUNT(*) FILTER (WHERE severity >= 8),
    'medium', COUNT(*) FILTER (WHERE severity >= 5 AND severity < 8),
    'low', COUNT(*) FILTER (WHERE severity < 5)
  ) INTO severity_counts
  FROM flags;

  -- Category counts (expand evidence.categories array)
  SELECT jsonb_agg(jsonb_build_object('name', category, 'count', cnt) ORDER BY cnt DESC)
  INTO category_data
  FROM (
    SELECT 
      COALESCE(cat, f.category) as category,
      COUNT(*) as cnt
    FROM flags f
    LEFT JOIN LATERAL jsonb_array_elements_text(
      COALESCE(f.evidence->'categories', jsonb_build_array(f.category))
    ) cat ON true
    GROUP BY COALESCE(cat, f.category)
  ) cats;

  -- Model counts (join interactions OR use evidence.modelId)
  SELECT jsonb_agg(jsonb_build_object('name', model_name, 'count', cnt) ORDER BY cnt DESC)
  INTO model_data
  FROM (
    SELECT 
      COALESCE(m.name, m2.name, 'Unknown') as model_name,
      COUNT(*) as cnt
    FROM flags f
    LEFT JOIN interactions i ON f.interaction_id = i.id
    LEFT JOIN ai_models m ON i.model_id = m.id
    LEFT JOIN ai_models m2 ON (f.evidence->>'modelId')::uuid = m2.id
    GROUP BY COALESCE(m.name, m2.name, 'Unknown')
  ) models;

  -- User counts (top 10, group by user_id to avoid name collisions)
  SELECT jsonb_agg(jsonb_build_object('name', user_name, 'count', cnt) ORDER BY cnt DESC)
  INTO user_data
  FROM (
    SELECT 
      COALESCE(u.full_name, u.email, 'Unknown') as user_name,
      COUNT(*) as cnt
    FROM flags f
    LEFT JOIN users u ON f.user_id = u.id
    GROUP BY f.user_id, u.full_name, u.email
    ORDER BY cnt DESC
    LIMIT 10
  ) users;

  -- Combine all results
  result := status_counts || jsonb_build_object(
    'bySeverity', severity_counts,
    'byCategory', COALESCE(category_data, '[]'::jsonb),
    'byModel', COALESCE(model_data, '[]'::jsonb),
    'byUser', COALESCE(user_data, '[]'::jsonb)
  );

  RETURN result;
END;
$$;
