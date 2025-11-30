import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'

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

    // Get tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .order('date', { ascending: false })

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 400 })
    }

    // Get habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)

    // Get time sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('time_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', new Date(startDate).toISOString())

    // Calculate productivity heatmap
    const daysArray = eachDayOfInterval({
      start: subDays(new Date(), days),
      end: new Date(),
    })

    const heatmap = daysArray.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayTasks = tasks?.filter((t) => t.date === dayStr) || []
      const completedTasks = dayTasks.filter((t) => t.done).length
      const totalTasks = dayTasks.length
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // Time tracked this day
      const daySessions = sessions?.filter((s) =>
        format(new Date(s.start_time), 'yyyy-MM-dd') === dayStr
      ) || []
      const dayMinutes = daySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

      // Calculate productivity score (0-100)
      let productivityScore = 0
      if (totalTasks > 0) {
        productivityScore += (completionRate * 0.6) // 60% weight on completion
      }
      if (dayMinutes > 0) {
        productivityScore += Math.min((dayMinutes / 60) * 20, 40) // 40% weight on time tracked (max 4 hours = 40 points)
      }

      return {
        date: format(day, 'yyyy-MM-dd'),
        day: format(day, 'EEE'),
        dayNumber: format(day, 'd'),
        completed_tasks: completedTasks,
        total_tasks: totalTasks,
        completion_rate: Math.round(completionRate),
        minutes_tracked: dayMinutes,
        hours_tracked: Math.round((dayMinutes / 60) * 100) / 100,
        productivity_score: Math.round(Math.min(productivityScore, 100)),
      }
    })

    // Weekly patterns
    const weeks: Record<number, any[]> = {}
    heatmap.forEach((day) => {
      const week = startOfWeek(new Date(day.date))
      const weekKey = week.getTime()
      if (!weeks[weekKey]) {
        weeks[weekKey] = []
      }
      weeks[weekKey].push(day)
    })

    const weeklyAverages = Object.entries(weeks).map(([weekKey, weekDays]) => {
      const avgCompletion = weekDays.reduce((sum, d) => sum + d.completion_rate, 0) / weekDays.length
      const avgProductivity = weekDays.reduce((sum, d) => sum + d.productivity_score, 0) / weekDays.length
      const totalHours = weekDays.reduce((sum, d) => sum + d.hours_tracked, 0)

      return {
        week_start: format(new Date(parseInt(weekKey)), 'MMM d'),
        avg_completion_rate: Math.round(avgCompletion),
        avg_productivity_score: Math.round(avgProductivity),
        total_hours: Math.round(totalHours * 100) / 100,
        days: weekDays.length,
      }
    })

    // Best/worst days
    const bestDay = heatmap.reduce((best, day) =>
      day.productivity_score > (best?.productivity_score || 0) ? day : best,
      heatmap[0]
    )
    const worstDay = heatmap.reduce((worst, day) =>
      day.productivity_score < (worst?.productivity_score || 100) ? day : worst,
      heatmap[0]
    )

    // Overall statistics
    const totalCompleted = tasks?.filter((t) => t.done).length || 0
    const totalTasks = tasks?.length || 0
    const overallCompletionRate = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0
    const avgProductivityScore = heatmap.length > 0
      ? Math.round(heatmap.reduce((sum, d) => sum + d.productivity_score, 0) / heatmap.length)
      : 0

    return NextResponse.json({
      heatmap,
      weekly_averages: weeklyAverages,
      best_day: bestDay,
      worst_day: worstDay,
      overall_completion_rate: Math.round(overallCompletionRate),
      average_productivity_score: avgProductivityScore,
      total_tasks: totalTasks,
      completed_tasks: totalCompleted,
      total_days_analyzed: heatmap.length,
    })
  } catch (error: any) {
    console.error('Error fetching productivity analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

