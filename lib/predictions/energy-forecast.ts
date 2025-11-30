import { createClient } from '@/lib/supabase/server'
import { format, subDays } from 'date-fns'

export interface EnergyForecast {
  date: string
  predicted_energy: 'low' | 'medium' | 'high'
  peak_hours: string[]
  suggested_plan_mode: 'light' | 'normal' | 'intense'
  contributing_factors: {
    sleep_quality?: number
    recent_completion_rate: number
    streak_maintenance: number
    time_tracked_recently: number
    day_of_week_factor: number
  }
  confidence: number
}

export async function predictEnergy(
  userId: string,
  date: string = format(new Date(), 'yyyy-MM-dd')
): Promise<EnergyForecast> {
  const supabase = createClient()
  const targetDate = new Date(date)
  const dayOfWeek = targetDate.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // Get recent completion rates (last 7 days)
  const sevenDaysAgo = format(subDays(targetDate, 7), 'yyyy-MM-dd')
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sevenDaysAgo)
    .lt('date', date)

  const recentCompleted = recentTasks?.filter((t) => t.done).length || 0
  const recentTotal = recentTasks?.length || 0
  const recentCompletionRate = recentTotal > 0 ? (recentCompleted / recentTotal) : 0.7

  // Get active streaks
  const { data: habits } = await supabase
    .from('habits')
    .select('streak')
    .eq('user_id', userId)
    .gt('streak', 0)

  const streakMaintenance = habits?.length || 0
  const avgStreak = habits?.length > 0
    ? habits.reduce((sum, h) => sum + h.streak, 0) / habits.length
    : 0

  // Get time tracked recently (last 3 days)
  const threeDaysAgo = format(subDays(targetDate, 3), 'yyyy-MM-dd')
  const { data: recentSessions } = await supabase
    .from('time_sessions')
    .select('duration_minutes')
    .eq('user_id', userId)
    .gte('start_time', new Date(threeDaysAgo).toISOString())

  const totalMinutes = recentSessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0
  const avgHoursPerDay = totalMinutes / (3 * 60)
  const timeTrackedRecently = Math.min(avgHoursPerDay / 8, 1) // Normalize to 0-1

  // Day of week factor
  // Typically: Monday = medium, Tuesday-Thursday = high, Friday = medium-high, Weekend = low
  let dayOfWeekFactor = 0.5
  switch (dayOfWeek) {
    case 1: // Monday
      dayOfWeekFactor = 0.6
      break
    case 2: // Tuesday
    case 3: // Wednesday
    case 4: // Thursday
      dayOfWeekFactor = 0.8
      break
    case 5: // Friday
      dayOfWeekFactor = 0.7
      break
    case 0: // Sunday
    case 6: // Saturday
      dayOfWeekFactor = 0.4
      break
  }

  // Get productivity patterns for peak hours
  const { data: patterns } = await supabase
    .from('productivity_patterns')
    .select('*')
    .eq('user_id', userId)
    .eq('pattern_type', 'best_time')
    .single()

  const peakHours = patterns?.pattern_data?.best_hours || []
  const peakHourStrings = peakHours
    .slice(0, 3)
    .map((h: any) => `${h.hour}:00`)

  // Calculate energy score (0-1)
  let energyScore = 0
  
  // Recent completion rate (40% weight)
  energyScore += recentCompletionRate * 0.4
  
  // Streak maintenance (20% weight)
  energyScore += Math.min(avgStreak / 30, 1) * 0.2
  
  // Time tracked (10% weight)
  energyScore += timeTrackedRecently * 0.1
  
  // Day of week (20% weight)
  energyScore += dayOfWeekFactor * 0.2
  
  // Weekend adjustment
  if (isWeekend) {
    energyScore *= 0.8 // Lower energy on weekends typically
  }

  // Determine predicted energy level
  let predictedEnergy: 'low' | 'medium' | 'high'
  if (energyScore >= 0.7) {
    predictedEnergy = 'high'
  } else if (energyScore >= 0.4) {
    predictedEnergy = 'medium'
  } else {
    predictedEnergy = 'low'
  }

  // Suggest plan mode
  let suggestedPlanMode: 'light' | 'normal' | 'intense'
  if (predictedEnergy === 'high') {
    suggestedPlanMode = 'intense'
  } else if (predictedEnergy === 'medium') {
    suggestedPlanMode = 'normal'
  } else {
    suggestedPlanMode = 'light'
  }

  // Calculate confidence (based on data availability)
  let confidence = 0.5
  if (recentTotal > 10) confidence += 0.2
  if (recentSessions && recentSessions.length > 5) confidence += 0.15
  if (streakMaintenance > 0) confidence += 0.15
  confidence = Math.min(1, confidence)

  return {
    date,
    predicted_energy: predictedEnergy,
    peak_hours: peakHourStrings,
    suggested_plan_mode: suggestedPlanMode,
    contributing_factors: {
      recent_completion_rate: recentCompletionRate,
      streak_maintenance: streakMaintenance,
      time_tracked_recently: timeTrackedRecently,
      day_of_week_factor: dayOfWeekFactor,
    },
    confidence,
  }
}

