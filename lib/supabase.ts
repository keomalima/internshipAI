
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://build-placeholder-dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1aWxkLXBsYWNlaG9sZGVyLWR1bW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.Ks_8VNdQWY_0VH0VQ8VqHQw0XxmZ1hnK7gXxGHfp_4'

// Log warning during build if using placeholder
if (supabaseUrl.includes('placeholder') || supabaseUrl.includes('dummy')) {
  console.warn('[Build] Using placeholder Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for production.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
