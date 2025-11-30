import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active session
    const { data: activeSession, error: activeError } = await supabase
      .from('active_time_sessions')
      .select('session_id, task_id, started_at')
      .eq('user_id', user.id)
      .single()

    if (activeError || !activeSession) {
      return NextResponse.json({ active: false })
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('time_sessions')
      .select('id, task_id, project_id, start_time, notes')
      .eq('id', activeSession.session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ active: false })
    }

    // Calculate elapsed time
    const startTime = new Date(session.start_time)
    const now = new Date()
    const elapsedMinutes = Math.round((now.getTime() - startTime.getTime()) / (1000 * 60))

    return NextResponse.json({
      active: true,
      session: {
        ...session,
        elapsed_minutes: elapsedMinutes,
      },
    })
  } catch (error: any) {
    console.error('Error getting time tracking status:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

