import { Task } from '@/lib/types'
import { addDays, addWeeks, addMonths, formatDate, getStartOfDay } from './utils'

export type RecurrencePattern = 
  | { type: 'daily'; interval: number } // Every N days
  | { type: 'weekly'; interval: number; daysOfWeek: number[] } // Every N weeks, on specific days
  | { type: 'monthly'; interval: number; dayOfMonth?: number } // Every N months
  | { type: 'custom'; cron?: string } // Future: cron support

export interface RecurringTaskConfig {
  pattern: RecurrencePattern
  endDate?: string // Optional end date
  maxOccurrences?: number // Optional max number of occurrences
  preserveTime?: boolean // Preserve original time
}

export function generateRecurringInstances(
  baseTask: Task,
  config: RecurringTaskConfig,
  count: number = 10
): Task[] {
  const instances: Task[] = []
  const baseDate = new Date(baseTask.date)
  const baseStart = baseTask.start_ts ? new Date(baseTask.start_ts) : null
  const baseEnd = baseTask.end_ts ? new Date(baseTask.end_ts) : null
  
  let currentDate = new Date(baseDate)
  let occurrences = 0

  // Check end date
  const endDate = config.endDate ? new Date(config.endDate) : null
  const maxOccurrences = config.maxOccurrences || count

  while (occurrences < count && occurrences < maxOccurrences) {
    // Check if we've passed the end date
    if (endDate && currentDate > endDate) {
      break
    }

    // Skip the first one (base task)
    if (occurrences > 0) {
      const instance: Task = {
        ...baseTask,
        id: `${baseTask.id}-${occurrences}`, // Temporary ID
        date: formatDate(currentDate),
        done: false,
      }

      // Preserve time if requested and available
      if (config.preserveTime !== false && baseStart && baseEnd) {
        const newStart = new Date(currentDate)
        newStart.setHours(baseStart.getHours(), baseStart.getMinutes(), 0, 0)
        
        const duration = baseEnd.getTime() - baseStart.getTime()
        const newEnd = new Date(newStart.getTime() + duration)

        instance.start_ts = newStart.toISOString()
        instance.end_ts = newEnd.toISOString()
      }

      instances.push(instance)
    }

    // Calculate next occurrence
    currentDate = getNextRecurrenceDate(currentDate, config.pattern)
    occurrences++
  }

  return instances
}

function getNextRecurrenceDate(
  currentDate: Date,
  pattern: RecurrencePattern
): Date {
  const next = new Date(currentDate)

  switch (pattern.type) {
    case 'daily':
      next.setDate(next.getDate() + pattern.interval)
      break

    case 'weekly':
      // Find next occurrence on one of the specified days
      const daysOfWeek = pattern.daysOfWeek || [next.getDay()]
      let daysAdded = 0
      
      while (daysAdded < 7 * pattern.interval) {
        next.setDate(next.getDate() + 1)
        daysAdded++
        
        if (daysOfWeek.includes(next.getDay())) {
          break
        }
      }
      break

    case 'monthly':
      next.setMonth(next.getMonth() + pattern.interval)
      if (pattern.dayOfMonth !== undefined) {
        next.setDate(pattern.dayOfMonth)
      }
      break

    default:
      // Default to daily if unknown pattern
      next.setDate(next.getDate() + 1)
  }

  return next
}

export function parseRecurringPattern(pattern: string): RecurrencePattern | null {
  // Simple parsing for common patterns
  // "daily", "weekly", "every 2 days", "every Monday", etc.
  
  const lower = pattern.toLowerCase().trim()
  
  if (lower === 'daily' || lower === 'every day') {
    return { type: 'daily', interval: 1 }
  }
  
  if (lower.startsWith('every')) {
    const match = lower.match(/every (\d+) days?/)
    if (match) {
      return { type: 'daily', interval: parseInt(match[1]) }
    }
    
    const weekMatch = lower.match(/every (\d+) weeks?/)
    if (weekMatch) {
      return { type: 'weekly', interval: parseInt(weekMatch[1]), daysOfWeek: [] }
    }
  }
  
  // Day of week mapping
  const dayMap: Record<string, number> = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  }
  
  for (const [day, num] of Object.entries(dayMap)) {
    if (lower.includes(day)) {
      return { type: 'weekly', interval: 1, daysOfWeek: [num] }
    }
  }
  
  return null
}

export function formatRecurrencePattern(pattern: RecurrencePattern): string {
  switch (pattern.type) {
    case 'daily':
      return pattern.interval === 1 
        ? 'Daily' 
        : `Every ${pattern.interval} days`
    
    case 'weekly':
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const days = pattern.daysOfWeek?.map(d => dayNames[d]).join(', ') || 'Weekly'
      return pattern.interval === 1 
        ? `Weekly (${days})`
        : `Every ${pattern.interval} weeks (${days})`
    
    case 'monthly':
      return pattern.interval === 1
        ? 'Monthly'
        : `Every ${pattern.interval} months`
    
    default:
      return 'Custom'
  }
}

