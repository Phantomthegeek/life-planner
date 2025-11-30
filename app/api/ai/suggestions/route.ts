import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get learned patterns
    const { data: patterns, error: patternsError } = await supabase
      .from('productivity_patterns')
      .select('*')
      .eq('user_id', user.id)

    if (patternsError) {
      return NextResponse.json({ error: patternsError.message }, { status: 400 })
    }

    // Get upcoming tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('done', false)
      .order('date', { ascending: true })
      .limit(20)

    // Generate personalized suggestions
    const suggestions: Array<{ type: string; message: string; action?: any }> = []

    // Best time suggestions
    const bestTimePattern = patterns?.find((p) => p.pattern_type === 'best_time')
    if (bestTimePattern) {
      const bestHours = bestTimePattern.pattern_data?.best_hours || []
      if (bestHours.length > 0) {
        suggestions.push({
          type: 'optimal_time',
          message: `Based on your patterns, you're most productive at ${bestHours[0].hour}:00. Consider scheduling important tasks then.`,
          action: {
            type: 'reschedule',
            hour: bestHours[0].hour,
          },
        })
      }
    }

    // Duration suggestions
    const durationPattern = patterns?.find((p) => p.pattern_type === 'duration_accuracy')
    if (durationPattern) {
      const recommendation = durationPattern.pattern_data?.recommendation
      if (recommendation) {
        suggestions.push({
          type: 'time_estimation',
          message: recommendation,
        })
      }
    }

    // Task suggestions based on patterns
    if (tasks && tasks.length > 0) {
      const highPriorityTasks = tasks.filter((t) => !t.start_ts)
      if (highPriorityTasks.length > 0 && bestTimePattern) {
        suggestions.push({
          type: 'schedule_tasks',
          message: `You have ${highPriorityTasks.length} tasks without scheduled times. Would you like to auto-schedule them at your optimal times?`,
          action: {
            type: 'auto_schedule',
            task_ids: highPriorityTasks.map((t) => t.id),
          },
        })
      }
    }

    return NextResponse.json({
      suggestions,
      patterns_found: patterns?.length || 0,
    })
  } catch (error: any) {
    console.error('Error getting suggestions:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

