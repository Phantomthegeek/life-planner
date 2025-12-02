import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from '@/lib/supabase/database.types'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, allow requests to pass through
  // (they'll be handled by the pages with proper error handling)
  if (!supabaseUrl || !supabaseAnonKey) {
    // Protect dashboard routes - redirect to login if not configured
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return response
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Protect dashboard routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    // Redirect authenticated users away from login page
    if (req.nextUrl.pathname === '/login' && session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  } catch (error) {
    // If there's an error checking session, allow the request to proceed
    // The page will handle the error appropriately
    console.error('Middleware auth error:', error instanceof Error ? error.message : 'Unknown error')
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}

