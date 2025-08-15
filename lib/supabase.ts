// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we're in the browser and environment variables are missing
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
  console.error('Required variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create client with fallback values for development
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_key'
)

// Admin client (server-side only)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key'
)