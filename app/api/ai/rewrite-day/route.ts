import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDailyPlan } from '@/lib/ai/coach'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, mode = 'normal', preferences } = body

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    // Fetch user preferences
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Fetch existing tasks for the date
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .order('start_ts', { ascending: true })

    // Fetch habits
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)

    // Fetch active certifications
    const { data: certProgress } = await supabase
      .from('user_cert_progress')
      .select(`
        *,
        certifications (*)
      `)
      .eq('user_id', user.id)
      .gt('progress', 0)
      .lt('progress', 100)

    const certifications = (certProgress || []).map((cp) => ({
      ...cp,
      name: cp.certifications?.name || '',
    }))

    // Generate rewritten plan (ignore existing tasks, create fresh)
    const plan = await generateDailyPlan({
      userPreferences: {
        wake_time: preferences?.wake_time || userData.wake_time || '07:00',
        sleep_time: preferences?.sleep_time || userData.sleep_time || '23:00',
        work_hours_start: preferences?.work_hours_start || userData.work_hours_start || '09:00',
        work_hours_end: preferences?.work_hours_end || userData.work_hours_end || '17:00',
      },
      existingTasks: [], // Fresh start - ignore existing
      habits: habits || [],
      certifications,
      mode,
      date,
    })

    // Save AI query
    await supabase.from('ai_queries').insert({
      user_id: user.id,
      prompt: {
        type: 'rewrite_day',
        date,
        mode,
      },
      response: plan,
    })

    return NextResponse.json({
      ...plan,
      message: 'Your day has been completely rewritten!',
    })
  } catch (error) {
    console.error('Error rewriting day:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

