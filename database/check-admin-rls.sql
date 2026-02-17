-- Check if is_admin() function exists
SELECT 
  'is_admin() function' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'is_admin'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check RLS policies for admin-critical tables
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual::text LIKE '%is_admin()%' OR with_check::text LIKE '%is_admin()%' 
    THEN '✅ Has admin check'
    ELSE '⚠️  No admin check'
  END as admin_access,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'exercises', 'ai_models', 'teams', 'team_members',
    'flags', 'flag_categories', 'flag_packages', 'interactions', 'exercise_models'
  )
ORDER BY tablename, policyname;

-- Check which tables have RLS enabled
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'exercises', 'ai_models', 'teams', 'team_members',
    'flags', 'flag_categories', 'flag_packages', 'interactions', 'exercise_models'
  )
ORDER BY tablename;

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'exercises', 'ai_models', 'teams', 'team_members',
    'flags', 'flag_categories', 'flag_packages', 'interactions', 'exercise_models'
  )
GROUP BY tablename
ORDER BY tablename;
