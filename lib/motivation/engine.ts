import { createClient } from '@/lib/supabase/server'
import { format, subDays } from 'date-fns'

export interface MotivationMessage {
  type: 'achievement' | 'encouragement' | 'warning' | 'celebration'
  message: string
  context: {
    based_on: string
    personalization: Record<string, any>
  }
  timing: 'morning' | 'midday' | 'evening' | 'contextual'
  action_url?: string
  action_text?: string
}

export async function generateMotivation(
  userId: string,
  context: 'morning' | 'midday' | 'evening' | 'contextual' = 'contextual'
): Promise<MotivationMessage> {
  const supabase = createClient()
  const now = new Date()
  const hour = now.getHours()

  // Get user state
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)

  const activeStreaks = habits?.filter((h) => h.streak > 0) || []
  const longestStreak = activeStreaks.length > 0
    ? Math.max(...activeStreaks.map((h) => h.streak))
    : 0

  // Get today's tasks
  const today = format(now, 'yyyy-MM-dd')
  const { data: todayTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)

  const completedToday = todayTasks?.filter((t) => t.done).length || 0
  const totalToday = todayTasks?.length || 0
  const todayProgress = totalToday > 0 ? (completedToday / totalToday) * 100 : 0

  // Get recent completion rate
  const sevenDaysAgo = format(subDays(now, 7), 'yyyy-MM-dd')
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sevenDaysAgo)

  const recentCompleted = recentTasks?.filter((t) => t.done).length || 0
  const recentTotal = recentTasks?.length || 0
  const recentRate = recentTotal > 0 ? (recentCompleted / recentTotal) * 100 : 0

  // Get achievements
  // This would query the achievements system

  // Determine timing if contextual
  let actualTiming: 'morning' | 'midday' | 'evening' = context as any
  if (context === 'contextual') {
    if (hour < 12) {
      actualTiming = 'morning'
    } else if (hour < 17) {
      actualTiming = 'midday'
    } else {
      actualTiming = 'evening'
    }
  }

  // Generate message based on context
  let message: MotivationMessage

  // Morning motivation
  if (actualTiming === 'morning') {
    if (longestStreak >= 7) {
      message = {
        type: 'achievement',
        message: `You're on a ${longestStreak}-day streak! Keep the momentum going today! 🔥`,
        context: {
          based_on: 'streak',
          personalization: { streak: longestStreak },
        },
        timing: 'morning',
      }
    } else if (recentRate >= 80) {
      message = {
        type: 'encouragement',
        message: `You've completed ${recentRate}% of tasks this week! You're on fire! Let's keep it up today! 💪`,
        context: {
          based_on: 'completion_rate',
          personalization: { rate: recentRate },
        },
        timing: 'morning',
      }
    } else {
      message = {
        type: 'encouragement',
        message: `Good morning! You have ${totalToday} tasks planned for today. Let's make it a productive day! ☀️`,
        context: {
          based_on: 'daily_plan',
          personalization: { task_count: totalToday },
        },
        timing: 'morning',
      }
    }
  }
  // Midday check-in
  else if (actualTiming === 'midday') {
    if (todayProgress >= 50) {
      message = {
        type: 'celebration',
        message: `Great progress! You've completed ${completedToday} tasks already. You're halfway there! 🎯`,
        context: {
          based_on: 'progress',
          personalization: { completed: completedToday, total: totalToday },
        },
        timing: 'midday',
      }
    } else if (todayProgress < 30 && totalToday > 0) {
      message = {
        type: 'warning',
        message: `You've completed ${completedToday} of ${totalToday} tasks. Want to reschedule some for later?`,
        context: {
          based_on: 'low_progress',
          personalization: { completed: completedToday, total: totalToday },
        },
        timing: 'midday',
        action_url: '/dashboard/planner',
        action_text: 'Reschedule Tasks',
      }
    } else {
      message = {
        type: 'encouragement',
        message: `Keep going! You've made good progress. ${totalToday - completedToday} tasks left to complete today!`,
        context: {
          based_on: 'progress',
          personalization: { remaining: totalToday - completedToday },
        },
        timing: 'midday',
      }
    }
  }
  // Evening reflection
  else {
    if (todayProgress >= 80) {
      message = {
        type: 'celebration',
        message: `Amazing day! You completed ${completedToday} tasks. That's ${todayProgress}% completion rate! 🌟`,
        context: {
          based_on: 'completion',
          personalization: { completed: completedToday, rate: todayProgress },
        },
        timing: 'evening',
      }
    } else if (todayProgress >= 50) {
      message = {
        type: 'encouragement',
        message: `Good work today! You completed ${completedToday} tasks. Every bit of progress counts! 💪`,
        context: {
          based_on: 'completion',
          personalization: { completed: completedToday },
        },
        timing: 'evening',
      }
    } else {
      message = {
        type: 'encouragement',
        message: `Tomorrow is a fresh start! You can reschedule any unfinished tasks and try again. 🎯`,
        context: {
          based_on: 'reflection',
          personalization: {},
        },
        timing: 'evening',
        action_url: '/dashboard/planner',
        action_text: 'Reschedule Tasks',
      }
    }
  }

  return message
}

