import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notes } = body

    // Get active session
    const { data: activeSession, error: activeError } = await supabase
      .from('active_time_sessions')
      .select('session_id')
      .eq('user_id', user.id)
      .single()

    if (activeError || !activeSession) {
      return NextResponse.json({ error: 'No active session' }, { status: 400 })
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('time_sessions')
      .select('start_time, task_id')
      .eq('id', activeSession.session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 400 })
    }

    // Stop the session
    const now = new Date().toISOString()
    const startTime = new Date(session.start_time)
    const endTime = new Date(now)
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

    const { data: updatedSession, error: updateError } = await supabase
      .from('time_sessions')
      .update({
        end_time: now,
        duration_minutes: durationMinutes,
        notes: notes || null,
      })
      .eq('id', activeSession.session_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Delete active session
    await supabase
      .from('active_time_sessions')
      .delete()
      .eq('user_id', user.id)

    // Update task's actual time if linked
    if (session.task_id) {
      const { data: task } = await supabase
        .from('tasks')
        .select('actual_time_minutes')
        .eq('id', session.task_id)
        .single()

      if (task) {
        const currentActual = task.actual_time_minutes || 0
        await supabase
          .from('tasks')
          .update({
            actual_time_minutes: currentActual + durationMinutes,
          })
          .eq('id', session.task_id)
      }
    }

    return NextResponse.json({ session: updatedSession, active: false })
  } catch (error: any) {
    console.error('Error stopping time tracking:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

