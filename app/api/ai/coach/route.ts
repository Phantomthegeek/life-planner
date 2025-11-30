import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDailyPlan } from '@/lib/ai/coach'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, mode = 'normal' } = body

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

    // Fetch active certifications with progress
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

    // Generate AI plan
    const plan = await generateDailyPlan({
      userPreferences: {
        wake_time: userData.wake_time || '07:00',
        sleep_time: userData.sleep_time || '23:00',
        work_hours_start: userData.work_hours_start || '09:00',
        work_hours_end: userData.work_hours_end || '17:00',
      },
      existingTasks: tasks || [],
      habits: habits || [],
      certifications,
      mode,
      date,
    })

    // Save AI query for history
    await supabase.from('ai_queries').insert({
      user_id: user.id,
      prompt: {
        date,
        mode,
        existingTasksCount: tasks?.length || 0,
        habitsCount: habits?.length || 0,
      },
      response: plan,
    })

    return NextResponse.json(plan)
  } catch (error: any) {
    console.error('Error in AI coach route:', error)
    const errorMessage = error?.message || 'Internal server error'
    const statusCode = error?.status || 500
    
    return NextResponse.json(
      { error: errorMessage, details: error?.stack },
      { status: statusCode }
    )
  }
}

