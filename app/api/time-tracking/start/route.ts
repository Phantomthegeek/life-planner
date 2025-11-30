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
    const { task_id, project_id, notes } = body

    // Stop any existing active session
    const { data: activeSession } = await supabase
      .from('active_time_sessions')
      .select('session_id')
      .eq('user_id', user.id)
      .single()

    if (activeSession) {
      // Stop the previous session
      const now = new Date().toISOString()
      const { data: oldSession } = await supabase
        .from('time_sessions')
        .select('start_time')
        .eq('id', activeSession.session_id)
        .single()

      if (oldSession) {
        const startTime = new Date(oldSession.start_time)
        const endTime = new Date(now)
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

        await supabase
          .from('time_sessions')
          .update({
            end_time: now,
            duration_minutes: durationMinutes,
          })
          .eq('id', activeSession.session_id)

        await supabase
          .from('active_time_sessions')
          .delete()
          .eq('user_id', user.id)
      }
    }

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from('time_sessions')
      .insert({
        user_id: user.id,
        task_id: task_id || null,
        project_id: project_id || null,
        start_time: new Date().toISOString(),
        notes: notes || null,
      })
      .select()
      .single()

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 400 })
    }

    // Create active session
    const { error: activeError } = await supabase
      .from('active_time_sessions')
      .insert({
        user_id: user.id,
        session_id: session.id,
        task_id: task_id || null,
      })

    if (activeError) {
      return NextResponse.json({ error: activeError.message }, { status: 400 })
    }

    return NextResponse.json({ session, active: true })
  } catch (error: any) {
    console.error('Error starting time tracking:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

