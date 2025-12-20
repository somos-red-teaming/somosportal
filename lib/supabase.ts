import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client configuration
 * Connects to the SOMOS platform database and authentication system
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

/**
 * Supabase client instance
 * Used throughout the application for database operations and authentication
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
