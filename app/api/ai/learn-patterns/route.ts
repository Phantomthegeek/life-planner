import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get task completion history
    const { data: history, error: historyError } = await supabase
      .from('task_completion_history')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(100)

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 400 })
    }

    if (!history || history.length === 0) {
      return NextResponse.json({ message: 'Not enough data to learn patterns' })
    }

    // Analyze patterns
    const patterns: Record<string, any> = {}

    // 1. Best time for tasks (by hour)
    const hourCompletion: Record<number, { count: number; onTime: number }> = {}
    history.forEach((record: any) => {
      if (record.actual_start) {
        const hour = new Date(record.actual_start).getHours()
        if (!hourCompletion[hour]) {
          hourCompletion[hour] = { count: 0, onTime: 0 }
        }
        hourCompletion[hour].count++
        if (record.completed_on_time) {
          hourCompletion[hour].onTime++
        }
      }
    })

    const bestHours = Object.entries(hourCompletion)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        completion_rate: (data.onTime / data.count) * 100,
        count: data.count,
      }))
      .sort((a, b) => b.completion_rate - a.completion_rate)
      .slice(0, 3)

    if (bestHours.length > 0) {
      patterns['best_time'] = {
        pattern_type: 'best_time',
        pattern_data: {
          best_hours: bestHours,
          recommendation: `Your most productive hours are ${bestHours.map((h) => `${h.hour}:00`).join(', ')}`,
        },
        confidence_score: Math.min(bestHours[0].count / 10, 1),
      }
    }

    // 2. Task duration accuracy
    const durationData: Array<{ estimated: number; actual: number }> = []
    history.forEach((record: any) => {
      if (record.estimated_minutes && record.actual_minutes) {
        durationData.push({
          estimated: record.estimated_minutes,
          actual: record.actual_minutes,
        })
      }
    })

    if (durationData.length > 0) {
      const avgRatio = durationData.reduce((sum, d) => sum + (d.actual / d.estimated), 0) / durationData.length
      patterns['duration_accuracy'] = {
        pattern_type: 'duration_accuracy',
        pattern_data: {
          average_ratio: avgRatio,
          tends_to_underestimate: avgRatio > 1.2,
          tends_to_overestimate: avgRatio < 0.8,
          recommendation: avgRatio > 1.2
            ? 'You tend to underestimate task duration. Consider adding 20-30% buffer time.'
            : avgRatio < 0.8
            ? 'You tend to overestimate task duration. You can plan more tasks!'
            : 'Your time estimates are quite accurate!',
        },
        confidence_score: Math.min(durationData.length / 20, 1),
      }
    }

    // 3. Category preferences (by completion rate)
    const categoryStats: Record<string, { completed: number; total: number }> = {}
    history.forEach((record: any) => {
      // We'll need to get category from tasks table
    })

    // Save patterns to database
    const patternsToSave = Object.values(patterns)
    for (const pattern of patternsToSave) {
      await supabase
        .from('productivity_patterns')
        .upsert({
          user_id: user.id,
          pattern_type: pattern.pattern_type,
          pattern_data: pattern.pattern_data,
          confidence_score: pattern.confidence_score,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'user_id,pattern_type',
        })
    }

    return NextResponse.json({
      patterns_learned: patternsToSave.length,
      patterns,
    })
  } catch (error: any) {
    console.error('Error learning patterns:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

