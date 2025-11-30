import { Task } from '@/lib/types'

export interface RescheduleSuggestion {
  taskId: string
  suggestedDate: string
  suggestedStart: string
  reason: string
  confidence: number
}

export function analyzeTaskForRescheduling(task: Task): RescheduleSuggestion | null {
  if (!task.start_ts || task.done) {
    return null
  }

  const now = new Date()
  const taskStart = new Date(task.start_ts)
  const taskDate = new Date(task.date)
  
  // Check if task is in the past
  if (taskStart < now) {
    const hoursPast = (now.getTime() - taskStart.getTime()) / (1000 * 60 * 60)
    
    // Suggest rescheduling if more than 1 hour past
    if (hoursPast > 1) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0) // Default to 9 AM tomorrow

      return {
        taskId: task.id,
        suggestedDate: tomorrow.toISOString().split('T')[0],
        suggestedStart: tomorrow.toISOString(),
        reason: `Task is ${Math.round(hoursPast)} hours overdue. Suggested: Tomorrow at 9 AM`,
        confidence: 0.8,
      }
    }
  }

  // Check if task date is in the past but task wasn't completed
  if (taskDate < new Date(now.toISOString().split('T')[0])) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Try to preserve original time if it was in the future
    const originalTime = task.start_ts ? new Date(task.start_ts) : null
    if (originalTime) {
      tomorrow.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0)
    } else {
      tomorrow.setHours(9, 0, 0, 0)
    }

    return {
      taskId: task.id,
      suggestedDate: tomorrow.toISOString().split('T')[0],
      suggestedStart: tomorrow.toISOString(),
      reason: 'Task was scheduled for a past date. Moving to tomorrow.',
      confidence: 0.9,
    }
  }

  return null
}

export function findOptimalRescheduleTime(
  task: Task,
  existingTasks: Task[],
  preferredHours: { start: string; end: string } = { start: '09:00', end: '17:00' }
): RescheduleSuggestion {
  const now = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Parse preferred hours
  const [prefStartHour, prefStartMin] = preferredHours.start.split(':').map(Number)
  const [prefEndHour] = preferredHours.end.split(':').map(Number)

  // Find next available slot
  let suggestedTime = new Date(tomorrow)
  suggestedTime.setHours(prefStartHour, prefStartMin || 0, 0, 0)

  // Get existing tasks for tomorrow
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  const tomorrowTasks = existingTasks
    .filter((t) => t.date === tomorrowStr && t.start_ts && !t.done)
    .sort((a, b) => {
      if (!a.start_ts || !b.start_ts) return 0
      return new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime()
    })

  // Find gaps in schedule
  let foundSlot = false
  const taskDuration = task.duration_minutes || 60

  // Check if we can fit at the start of day
  if (tomorrowTasks.length === 0) {
    foundSlot = true
  } else {
    // Check gaps between tasks
    for (let i = 0; i < tomorrowTasks.length; i++) {
      const currentTask = tomorrowTasks[i]
      if (!currentTask.start_ts || !currentTask.end_ts) continue

      const currentEnd = new Date(currentTask.end_ts)
      
      if (i === 0) {
        // Check gap from start of day
        const dayStart = new Date(suggestedTime)
        dayStart.setHours(prefStartHour, prefStartMin || 0, 0, 0)
        
        if (currentEnd.getTime() - dayStart.getTime() >= taskDuration * 60 * 1000) {
          suggestedTime = dayStart
          foundSlot = true
          break
        }
      }

      // Check gap to next task
      if (i < tomorrowTasks.length - 1) {
        const nextTask = tomorrowTasks[i + 1]
        if (!nextTask.start_ts) continue
        
        const nextStart = new Date(nextTask.start_ts)
        const gap = nextStart.getTime() - currentEnd.getTime()
        
        if (gap >= taskDuration * 60 * 1000) {
          suggestedTime = new Date(currentEnd)
          foundSlot = true
          break
        }
      } else {
        // Last task - check if we can fit after
        const dayEnd = new Date(suggestedTime)
        dayEnd.setHours(prefEndHour, 0, 0, 0)
        
        if (dayEnd.getTime() - currentEnd.getTime() >= taskDuration * 60 * 1000) {
          suggestedTime = new Date(currentEnd)
          foundSlot = true
          break
        }
      }
    }
  }

  // If no slot found, suggest end of day
  if (!foundSlot) {
    suggestedTime = new Date(tomorrow)
    suggestedTime.setHours(prefEndHour - 1, 0, 0, 0)
  }

  return {
    taskId: task.id,
    suggestedDate: tomorrow.toISOString().split('T')[0],
    suggestedStart: suggestedTime.toISOString(),
    reason: foundSlot 
      ? 'Optimal time slot found based on your schedule'
      : 'Suggested for end of day',
    confidence: foundSlot ? 0.85 : 0.6,
  }
}

