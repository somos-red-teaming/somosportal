import { createClient } from '@supabase/supabase-js'

// Use fallback values for build time, real values at runtime
const supabaseUrl = typeof window !== 'undefined' 
  ? (window as any).ENV?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://barcrmxjgisydxjtnolv.supabase.co'
  : process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://barcrmxjgisydxjtnolv.supabase.co'

const supabaseAnonKey = typeof window !== 'undefined'
  ? (window as any).ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcmNybXhqZ2lzeWR4anRub2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDc3ODQsImV4cCI6MjA3ODcyMzc4NH0.VutuXLbeRSdfje4_mORWKV-ysiEbQeSPC1Zwm9oNks0'
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcmNybXhqZ2lzeWR4anRub2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDc3ODQsImV4cCI6MjA3ODcyMzc4NH0.VutuXLbeRSdfje4_mORWKV-ysiEbQeSPC1Zwm9oNks0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
