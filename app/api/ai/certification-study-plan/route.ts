import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCertificationStudyPlan } from '@/lib/ai/certification-planner'

// Force dynamic route - prevents build-time analysis issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Check environment variables before creating client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          message: 'Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.',
          details: 'See VERCEL_ENV_SETUP.md for setup instructions'
        },
        { status: 500 }
      )
    }

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { cert_id, hours_per_week = 10, start_date } = body

    if (!cert_id) {
      return NextResponse.json(
        { error: 'Certification ID is required' },
        { status: 400 }
      )
    }

    // Fetch certification
    const { data: cert, error: certError } = await supabase
      .from('certifications')
      .select('*')
      .eq('id', cert_id)
      .single()

    if (certError || !cert) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      )
    }

    // Fetch modules
    const { data: modules } = await supabase
      .from('cert_modules')
      .select('*')
      .eq('cert_id', cert_id)
      .order('order_idx', { ascending: true })

    // Fetch user progress
    const { data: progress } = await supabase
      .from('user_cert_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('cert_id', cert_id)
      .single()

    const startDate = start_date || new Date().toISOString().split('T')[0]
    const targetDate = progress?.target_date || null

    // Generate study plan
    const studyPlan = await generateCertificationStudyPlan({
      cert_id,
      cert_name: cert.name,
      modules: (modules || []).map((m) => ({
        id: m.id,
        title: m.title,
        estimated_hours: m.estimated_hours,
        description: m.description || undefined,
      })),
      current_progress: progress?.progress || 0,
      target_date: targetDate,
      hours_per_week,
      start_date: startDate,
    })

    // Save AI query
    await supabase.from('ai_queries').insert({
      user_id: user.id,
      prompt: {
        type: 'certification_study_plan',
        cert_id,
        hours_per_week,
      },
      response: studyPlan,
    })

    return NextResponse.json(studyPlan)
  } catch (error: any) {
    console.error('Error generating certification study plan:', error)
    
    // Check if it's an environment variable error
    if (error?.message?.includes('Missing Supabase environment variables')) {
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          message: error.message,
          details: 'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables. See VERCEL_ENV_SETUP.md for instructions.'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}

