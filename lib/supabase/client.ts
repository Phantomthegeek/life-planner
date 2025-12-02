import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that will fail gracefully instead of throwing
    // This prevents client-side crashes when env vars are missing
    console.warn('Supabase environment variables are missing. Some features may not work.')
    return createBrowserClient<Database>(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

