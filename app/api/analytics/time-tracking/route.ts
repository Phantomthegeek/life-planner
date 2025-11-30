import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')

    // Get time sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('time_sessions')
      .select('*, tasks(category, title)')
      .eq('user_id', user.id)
      .gte('start_time', new Date(startDate).toISOString())
      .order('start_time', { ascending: false })

    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 400 })
    }

    // Calculate statistics
    const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100

    // By day
    const daysArray = eachDayOfInterval({
      start: subDays(new Date(), days),
      end: new Date(),
    })

    const byDay = daysArray.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const daySessions = sessions?.filter((s) =>
        format(new Date(s.start_time), 'yyyy-MM-dd') === dayStr
      ) || []
      const dayMinutes = daySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
      return {
        date: format(day, 'MMM d'),
        minutes: dayMinutes,
        hours: Math.round((dayMinutes / 60) * 100) / 100,
        sessions: daySessions.length,
      }
    })

    // By category
    const byCategory: Record<string, number> = {}
    sessions?.forEach((session: any) => {
      const category = session.tasks?.category || 'other'
      const minutes = session.duration_minutes || 0
      byCategory[category] = (byCategory[category] || 0) + minutes
    })

    // By hour (peak hours)
    const byHour: Record<number, number> = {}
    sessions?.forEach((session: any) => {
      const hour = new Date(session.start_time).getHours()
      const minutes = session.duration_minutes || 0
      byHour[hour] = (byHour[hour] || 0) + minutes
    })

    // Average session duration
    const completedSessions = sessions?.filter((s) => s.duration_minutes) || []
    const avgSessionMinutes = completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) /
            completedSessions.length
        )
      : 0

    return NextResponse.json({
      total_minutes: totalMinutes,
      total_hours: totalHours,
      total_sessions: sessions?.length || 0,
      average_session_minutes: avgSessionMinutes,
      by_day: byDay,
      by_category: byCategory,
      by_hour: byHour,
    })
  } catch (error: any) {
    console.error('Error fetching time tracking analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

