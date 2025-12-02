import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDailyPlan } from '@/lib/ai/coach'
import { formatDate, addDays } from '@/lib/utils'

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
    const { startDate, mode = 'normal' } = body

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
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

    const endDate = addDays(new Date(startDate), 6)
    const startDateStr = formatDate(new Date(startDate))
    const endDateStr = formatDate(endDate)

    // Fetch existing tasks for the week
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
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

    // Generate plans for each day of the week
    const weeklyPlans = []
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(new Date(startDate), i)
      const dateStr = formatDate(currentDate)
      const dayTasks = (tasks || []).filter((t) => t.date === dateStr)

      const plan = await generateDailyPlan({
        userPreferences: {
          wake_time: userData.wake_time || '07:00',
          sleep_time: userData.sleep_time || '23:00',
          work_hours_start: userData.work_hours_start || '09:00',
          work_hours_end: userData.work_hours_end || '17:00',
        },
        existingTasks: dayTasks,
        habits: habits || [],
        certifications,
        mode,
        date: dateStr,
      })

      weeklyPlans.push({
        date: dateStr,
        plan,
      })
    }

    // Save AI queries
    await supabase.from('ai_queries').insert({
      user_id: user.id,
      prompt: {
        type: 'weekly_plan',
        startDate,
        mode,
      },
      response: weeklyPlans,
    })

    return NextResponse.json({ plans: weeklyPlans })
  } catch (error) {
    console.error('Error in weekly AI plan route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

