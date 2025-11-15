-- SOMOS Civic Lab - Row Level Security Policies
-- Comprehensive security for multi-tenant AI red-teaming platform

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participation_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.users 
        WHERE auth_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is moderator or admin
CREATE OR REPLACE FUNCTION is_moderator_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'moderator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own profile and public profiles
CREATE POLICY "Users can view profiles" ON public.users
    FOR SELECT USING (
        auth_user_id = auth.uid() OR 
        is_admin() OR
        is_active = true
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Only admins can insert new users (handled by triggers)
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (is_admin());

-- Only admins can delete users
CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE USING (is_admin());

-- =====================================================
-- USER PROFILES TABLE POLICIES
-- =====================================================

-- Users can view their own profile and public profiles
CREATE POLICY "View user profiles" ON public.user_profiles
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) OR
        is_admin() OR
        user_id IN (
            SELECT id FROM public.users 
            WHERE is_active = true
        )
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

-- =====================================================
-- AI MODELS TABLE POLICIES
-- =====================================================

-- Everyone can view active public models
CREATE POLICY "View public AI models" ON public.ai_models
    FOR SELECT USING (is_active = true AND is_public = true);

-- Admins can view all models
CREATE POLICY "Admins view all AI models" ON public.ai_models
    FOR SELECT USING (is_admin());

-- Only admins can manage AI models
CREATE POLICY "Admins manage AI models" ON public.ai_models
    FOR ALL USING (is_admin());

-- =====================================================
-- EXERCISES TABLE POLICIES
-- =====================================================

-- Users can view active exercises
CREATE POLICY "View active exercises" ON public.exercises
    FOR SELECT USING (
        status IN ('active', 'completed') OR
        is_admin() OR
        created_by IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Admins can manage all exercises
CREATE POLICY "Admins manage exercises" ON public.exercises
    FOR ALL USING (is_admin());

-- Users can create exercises (if they have permission)
CREATE POLICY "Create exercises" ON public.exercises
    FOR INSERT WITH CHECK (
        is_admin() OR
        created_by IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- =====================================================
-- EXERCISE PARTICIPATION POLICIES
-- =====================================================

-- Users can view their own participation
CREATE POLICY "View own participation" ON public.exercise_participation
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) OR
        is_admin()
    );

-- Users can manage their own participation
CREATE POLICY "Manage own participation" ON public.exercise_participation
    FOR ALL USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) OR
        is_admin()
    );

-- =====================================================
-- INTERACTIONS TABLE POLICIES
-- =====================================================

-- Users can view their own interactions
CREATE POLICY "View own interactions" ON public.interactions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) OR
        is_moderator_or_admin()
    );

-- Users can create their own interactions
CREATE POLICY "Create own interactions" ON public.interactions
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Users can update their own interactions (limited fields)
CREATE POLICY "Update own interactions" ON public.interactions
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Moderators and admins can delete interactions
CREATE POLICY "Moderators delete interactions" ON public.interactions
    FOR DELETE USING (is_moderator_or_admin());

-- =====================================================
-- FLAGS TABLE POLICIES
-- =====================================================

-- Users can view their own flags and moderators can view all
CREATE POLICY "View flags" ON public.flags
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) OR
        is_moderator_or_admin()
    );

-- Users can create flags
CREATE POLICY "Create flags" ON public.flags
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Users can update their own pending flags
CREATE POLICY "Update own flags" ON public.flags
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) AND status = 'pending'
    );

-- Moderators can update flag status
CREATE POLICY "Moderators update flags" ON public.flags
    FOR UPDATE USING (is_moderator_or_admin());

-- =====================================================
-- PARTICIPATION STATS POLICIES
-- =====================================================

-- Users can view their own stats, admins can view all
CREATE POLICY "View participation stats" ON public.participation_stats
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) OR
        is_admin()
    );

-- System can insert/update stats (via functions)
CREATE POLICY "System manage stats" ON public.participation_stats
    FOR ALL USING (is_admin());

-- =====================================================
-- SYSTEM SETTINGS POLICIES
-- =====================================================

-- Everyone can view public settings
CREATE POLICY "View public settings" ON public.system_settings
    FOR SELECT USING (is_public = true OR is_admin());

-- Only admins can manage system settings
CREATE POLICY "Admins manage settings" ON public.system_settings
    FOR ALL USING (is_admin());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
