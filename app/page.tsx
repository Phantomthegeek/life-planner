import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Check environment variables before attempting to create client
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // If Supabase is not configured, redirect to login
    redirect('/login')
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      redirect('/dashboard')
    } else {
      redirect('/login')
    }
  } catch (error) {
    // If there's any error, redirect to login
    // Don't log the error object directly as it might not be serializable
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error checking auth:', errorMessage)
    redirect('/login')
  }
}

