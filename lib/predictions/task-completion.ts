import { createClient } from '@/lib/supabase/server'
import { Task } from '@/lib/types'
import { format } from 'date-fns'

export interface TaskCompletionPrediction {
  task_id: string
  completion_likelihood: number // 0-1
  risk_level: 'low' | 'medium' | 'high'
  risk_factors: string[]
  suggested_time?: string
  confidence: number
  reasoning: string
}

export async function predictTaskCompletion(
  userId: string,
  taskId: string
): Promise<TaskCompletionPrediction> {
  const supabase = createClient()
  
  // Get task details
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task) {
    throw new Error('Task not found')
  }

  // Get completion history for similar tasks
  const { data: history } = await supabase
    .from('task_completion_history')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(100)

  // Get user patterns
  const { data: patterns } = await supabase
    .from('productivity_patterns')
    .select('*')
    .eq('user_id', userId)

  const riskFactors: string[] = []
  let completionLikelihood = 0.7 // Base likelihood
  let confidence = 0.5

  // Factor 1: Time of day
  const scheduledTime = task.start_ts ? new Date(task.start_ts).getHours() : null
  const bestTimePattern = patterns?.find((p) => p.pattern_type === 'best_time')
  if (bestTimePattern && scheduledTime !== null) {
    const bestHours = bestTimePattern.pattern_data?.best_hours || []
    const isInBestTime = bestHours.some((h: any) => h.hour === scheduledTime)
    if (!isInBestTime) {
      riskFactors.push(`Scheduled outside your optimal hours (${bestHours.map((h: any) => `${h.hour}:00`).join(', ')})`)
      completionLikelihood -= 0.15
    } else {
      completionLikelihood += 0.1
      confidence += 0.1
    }
  }

  // Factor 2: Task category patterns
  if (task.category) {
    const categoryTasks = history?.filter((h: any) => {
      // Get category from task if we can link it
      return true // Simplified - would need task linking
    }) || []
    
    const categoryCompletionRate = categoryTasks.length > 0
      ? categoryTasks.filter((h: any) => h.completed_on_time).length / categoryTasks.length
      : 0.7

    if (categoryCompletionRate < 0.5) {
      riskFactors.push(`Low completion rate for ${task.category} tasks`)
      completionLikelihood -= 0.1
    } else {
      completionLikelihood += categoryCompletionRate * 0.2
    }
  }

  // Factor 3: Overdue tasks
  const taskDate = new Date(task.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  taskDate.setHours(0, 0, 0, 0)

  if (taskDate < today && !task.done) {
    riskFactors.push('Task is overdue')
    completionLikelihood -= 0.3
  }

  // Factor 4: Duration vs time available
  if (task.duration_minutes && task.start_ts && task.end_ts) {
    const scheduledDuration = (new Date(task.end_ts).getTime() - new Date(task.start_ts).getTime()) / (1000 * 60)
    const estimatedDuration = task.duration_minutes
    
    if (scheduledDuration < estimatedDuration * 0.8) {
      riskFactors.push('Not enough time allocated for this task')
      completionLikelihood -= 0.2
    }
  }

  // Factor 5: Similar task history
  const similarTasks = history?.filter((h: any) => {
    // Check if similar based on category, duration, etc.
    return true // Simplified
  }) || []

  if (similarTasks.length > 0) {
    const similarCompletionRate = similarTasks.filter((h: any) => h.completed_on_time).length / similarTasks.length
    completionLikelihood = completionLikelihood * 0.5 + similarCompletionRate * 0.5
    confidence += 0.2
  }

  // Factor 6: Current workload
  const { data: todayTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', task.date)
    .eq('done', false)

  const taskCount = todayTasks?.length || 0
  if (taskCount > 8) {
    riskFactors.push(`High workload today (${taskCount} tasks)`)
    completionLikelihood -= 0.1
  }

  // Factor 7: Habit streaks (motivation factor)
  const { data: habits } = await supabase
    .from('habits')
    .select('streak')
    .eq('user_id', userId)
    .gt('streak', 0)

  const activeStreaks = habits?.length || 0
  if (activeStreaks >= 3) {
    completionLikelihood += 0.05 // Small boost from motivation
  } else if (activeStreaks === 0) {
    completionLikelihood -= 0.05
    riskFactors.push('No active habit streaks (lower motivation)')
  }

  // Normalize likelihood
  completionLikelihood = Math.max(0, Math.min(1, completionLikelihood))
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high'
  if (completionLikelihood >= 0.7) {
    riskLevel = 'low'
  } else if (completionLikelihood >= 0.4) {
    riskLevel = 'medium'
  } else {
    riskLevel = 'high'
  }

  // Suggest optimal time if risk is high
  let suggestedTime: string | undefined
  if (riskLevel === 'high' && bestTimePattern) {
    const bestHours = bestTimePattern.pattern_data?.best_hours || []
    if (bestHours.length > 0) {
      const optimalHour = bestHours[0].hour
      suggestedTime = `${optimalHour}:00`
    }
  }

  // Generate reasoning
  let reasoning = ''
  if (completionLikelihood >= 0.7) {
    reasoning = 'High likelihood of completion based on your patterns.'
  } else if (completionLikelihood >= 0.4) {
    reasoning = 'Moderate likelihood. Consider rescheduling or simplifying.'
  } else {
    reasoning = 'Low likelihood. Multiple risk factors detected.'
  }

  if (riskFactors.length > 0) {
    reasoning += ` Factors: ${riskFactors.slice(0, 3).join(', ')}.`
  }

  return {
    task_id: taskId,
    completion_likelihood: Math.round(completionLikelihood * 100) / 100,
    risk_level: riskLevel,
    risk_factors: riskFactors,
    suggested_time: suggestedTime,
    confidence: Math.min(1, confidence),
    reasoning,
  }
}

export async function identifyRiskTasks(
  userId: string,
  date: string
): Promise<{ high_risk_tasks: Array<Task & { prediction: TaskCompletionPrediction }>, reasons: string[] }> {
  const supabase = createClient()

  // Get all tasks for the day
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('done', false)

  if (!tasks || tasks.length === 0) {
    return { high_risk_tasks: [], reasons: [] }
  }

  // Predict completion for each task
  const predictions = await Promise.all(
    tasks.map(async (task) => ({
      task,
      prediction: await predictTaskCompletion(userId, task.id),
    }))
  )

  // Filter high-risk tasks
  const highRisk = predictions
    .filter((p) => p.prediction.risk_level === 'high')
    .map((p) => ({
      ...p.task,
      prediction: p.prediction,
    }))

  const reasons = Array.from(
    new Set(
      highRisk.flatMap((t) => t.prediction.risk_factors)
    )
  )

  return {
    high_risk_tasks: highRisk,
    reasons,
  }
}

