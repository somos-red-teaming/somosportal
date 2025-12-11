-- Fix RLS policies for user_profiles table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "View user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Insert own profile" ON public.user_profiles;

-- Users can view their own profile and public profiles
CREATE POLICY "View user profiles" ON public.user_profiles
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
        OR 
        (privacy_settings->>'profile_public')::boolean = true
    );

-- Users can update their own profile
CREATE POLICY "Update own profile" ON public.user_profiles
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Users can insert their own profile
CREATE POLICY "Insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );
