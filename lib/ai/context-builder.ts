import { createClient } from '@/lib/supabase/server'
import { format, subDays } from 'date-fns'
import { Task, Habit, Project, Goal, Certification, UserCertProgress } from '@/lib/types'

export interface AIContextBundle {
  user_preferences: {
    wake_time: string
    sleep_time: string
    work_hours_start: string
    work_hours_end: string
    timezone?: string
  }
  
  current_state: {
    today_plan: Task[]
    yesterday_completion: number
    current_mood?: string
    time_spent_vs_estimated: number
    habits_completed: Habit[]
    active_streaks: number
  }
  
  progress_context: {
    certification_progress: UserCertProgress[]
    active_projects: Project[]
    active_goals: Goal[]
    upcoming_deadlines: Task[]
    project_milestones: any[]
  }
  
  behavioral_insights: {
    tasks_tend_to_skip: Task[]
    preferred_focus_blocks: Array<{ start: string; end: string; category: string }>
    completion_patterns: {
      best_hours: number[]
      best_days: string[]
      avg_completion_rate: number
    }
    accuracy_metrics: {
      duration_prediction_accuracy: number
      completion_likelihood_accuracy: number
    }
  }
  
  time_context: {
    current_hour: number
    day_of_week: string
    is_weekend: boolean
    days_since_start: number
  }
}

export async function buildContextBundle(
  userId: string,
  date: string = format(new Date(), 'yyyy-MM-dd')
): Promise<AIContextBundle> {
  const supabase = createClient()
  const today = new Date(date)
  const yesterday = format(subDays(today, 1), 'yyyy-MM-dd')
  
  // Get user preferences
  const { data: user } = await supabase
    .from('users')
    .select('wake_time, sleep_time, work_hours_start, work_hours_end, timezone')
    .eq('id', userId)
    .single()

  // Get today's tasks
  const { data: todayTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('start_ts', { ascending: true })

  // Get yesterday's tasks for completion rate
  const { data: yesterdayTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', yesterday)

  const yesterdayCompleted = yesterdayTasks?.filter((t) => t.done).length || 0
  const yesterdayTotal = yesterdayTasks?.length || 0
  const yesterdayCompletion = yesterdayTotal > 0 
    ? (yesterdayCompleted / yesterdayTotal) * 100 
    : 0

  // Get habits
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)

  const activeStreaks = habits?.filter((h) => h.streak > 0).length || 0

  // Get time tracking data
  const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd')
  const { data: timeSessions } = await supabase
    .from('time_sessions')
    .select('*, tasks(category, duration_minutes, actual_time_minutes)')
    .eq('user_id', userId)
    .gte('start_time', new Date(thirtyDaysAgo).toISOString())

  // Calculate time accuracy
  const sessionsWithData = timeSessions?.filter((s: any) => 
    s.tasks?.duration_minutes && s.duration_minutes
  ) || []
  
  const timeAccuracy = sessionsWithData.length > 0
    ? sessionsWithData.reduce((acc: number, s: any) => {
        const estimated = s.tasks?.duration_minutes || 0
        const actual = s.duration_minutes || 0
        const diff = Math.abs(actual - estimated) / estimated
        return acc + (1 - Math.min(diff, 1))
      }, 0) / sessionsWithData.length
    : 0.5

  // Get projects and goals
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  // Get certification progress
  const { data: certProgress } = await supabase
    .from('user_cert_progress')
    .select('*')
    .eq('user_id', userId)
    .lt('progress', 100)

  // Get upcoming deadlines (next 7 days)
  const nextWeek = format(subDays(today, -7), 'yyyy-MM-dd')
  const { data: upcomingTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', date)
    .lte('date', nextWeek)
    .eq('done', false)
    .order('date', { ascending: true })
    .limit(10)

  // Get task completion history for patterns
  const { data: completionHistory } = await supabase
    .from('task_completion_history')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(100)

  // Analyze completion patterns
  const hourCompletions: Record<number, { completed: number; total: number }> = {}
  completionHistory?.forEach((record: any) => {
    if (record.actual_start) {
      const hour = new Date(record.actual_start).getHours()
      if (!hourCompletions[hour]) {
        hourCompletions[hour] = { completed: 0, total: 0 }
      }
      hourCompletions[hour].total++
      if (record.completed_on_time) {
        hourCompletions[hour].completed++
      }
    }
  })

  const bestHours = Object.entries(hourCompletions)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      completion_rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
    }))
    .sort((a, b) => b.completion_rate - a.completion_rate)
    .slice(0, 3)
    .map((h) => h.hour)

  // Get tasks user tends to skip
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('done', false)
    .lt('date', date)
    .limit(10)

  // Analyze preferred focus blocks from time sessions
  const focusBlocks: Record<string, { count: number; categories: Set<string> }> = {}
  timeSessions?.forEach((session: any) => {
    const hour = new Date(session.start_time).getHours()
    const block = `${hour}:00-${hour + 1}:00`
    if (!focusBlocks[block]) {
      focusBlocks[block] = { count: 0, categories: new Set() }
    }
    focusBlocks[block].count++
    if (session.tasks?.category) {
      focusBlocks[block].categories.add(session.tasks.category)
    }
  })

  const preferredBlocks = Object.entries(focusBlocks)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([block, data]) => {
      const [start] = block.split('-')
      return {
        start: `${start}:00`,
        end: `${parseInt(start.split(':')[0]) + 1}:00`,
        category: Array.from(data.categories)[0] || 'work',
      }
    })

  // Get average completion rate
  const totalTasks = completionHistory?.length || 0
  const completedTasks = completionHistory?.filter((h: any) => h.completed_on_time).length || 0
  const avgCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 50

  // Get recent notes for mood analysis (simplified)
  const { data: recentNotes } = await supabase
    .from('notes')
    .select('content')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5)

  // Simple mood detection from notes (can be enhanced with AI)
  const moodKeywords = {
    positive: ['great', 'good', 'happy', 'excited', 'accomplished', 'progress'],
    negative: ['stress', 'tired', 'difficult', 'struggle', 'overwhelmed', 'exhausted'],
  }
  
  let moodScore = 0
  recentNotes?.forEach((note) => {
    const text = note.content.toLowerCase()
    moodKeywords.positive.forEach((word) => {
      if (text.includes(word)) moodScore++
    })
    moodKeywords.negative.forEach((word) => {
      if (text.includes(word)) moodScore--
    })
  })

  const currentMood = moodScore > 0 ? 'positive' : moodScore < 0 ? 'negative' : 'neutral'

  // Build context bundle
  return {
    user_preferences: {
      wake_time: user?.wake_time || '07:00',
      sleep_time: user?.sleep_time || '23:00',
      work_hours_start: user?.work_hours_start || '09:00',
      work_hours_end: user?.work_hours_end || '17:00',
      timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    
    current_state: {
      today_plan: todayTasks || [],
      yesterday_completion: yesterdayCompletion,
      current_mood: currentMood,
      time_spent_vs_estimated: timeAccuracy,
      habits_completed: habits?.filter((h) => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return h.last_done === today
      }) || [],
      active_streaks: activeStreaks,
    },
    
    progress_context: {
      certification_progress: certProgress || [],
      active_projects: projects || [],
      active_goals: goals || [],
      upcoming_deadlines: upcomingTasks || [],
      project_milestones: [], // Can be populated from milestones table
    },
    
    behavioral_insights: {
      tasks_tend_to_skip: allTasks || [],
      preferred_focus_blocks: preferredBlocks,
      completion_patterns: {
        best_hours: bestHours,
        best_days: [], // Can be enhanced
        avg_completion_rate: avgCompletionRate,
      },
      accuracy_metrics: {
        duration_prediction_accuracy: timeAccuracy,
        completion_likelihood_accuracy: avgCompletionRate / 100,
      },
    },
    
    time_context: {
      current_hour: new Date().getHours(),
      day_of_week: format(today, 'EEEE'),
      is_weekend: [0, 6].includes(today.getDay()),
      days_since_start: Math.floor((today.getTime() - new Date(user?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
    },
  }
}

