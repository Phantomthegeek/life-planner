/**
 * Event Handlers for Little Einstein
 * Auto-run logic when events are emitted
 */

import { eventBus, SystemEvent, EventData } from './event-bus'
import { learningLoop } from '@/lib/ai/learning-loop'
import { createClient } from '@/lib/supabase/server'

// Task Completion Handler
eventBus.subscribe('TaskCompleted', async (data: EventData) => {
  if (data.entity_type === 'task' && data.entity_id) {
    // Update learning loop
    // This would record actual completion vs predicted
    
    // Award XP (if gamification is enabled)
    // This would call the gamification store
    
    // Update project progress (handled by DB trigger, but can add extra logic)
    
    console.log('Task completed event:', data.entity_id)
  }
})

// Habit Checked Handler
eventBus.subscribe('HabitChecked', async (data: EventData) => {
  if (data.entity_type === 'habit' && data.entity_id) {
    // Update streak
    // Award XP
    // Check for achievements
    // Update patterns
    
    console.log('Habit checked event:', data.entity_id)
  }
})

// Time Session Ended Handler
eventBus.subscribe('TimeSessionEnded', async (data: EventData) => {
  if (data.entity_type === 'time_session' && data.metadata) {
    // Record actual time vs estimated
    // Update learning loop
    // Update task actual time
    
    const { task_id, estimated_minutes, actual_minutes } = data.metadata
    
    if (task_id && estimated_minutes && actual_minutes) {
      await learningLoop.recordOutcome(
        data.user_id,
        {
          type: 'duration',
          predicted: estimated_minutes,
          taskId: task_id,
        },
        actual_minutes
      )
    }
    
    console.log('Time session ended event:', data.entity_id)
  }
})

// Plan Generated Handler
eventBus.subscribe('PlanGenerated', async (data: EventData) => {
  // Track AI usage
  // Update patterns
  // Log for analytics
  
  console.log('Plan generated event:', data.metadata?.mode)
})

// Pattern Learned Handler
eventBus.subscribe('PatternLearned', async (data: EventData) => {
  // Update personalization model
  // Clear related caches
  // Notify user of new insights
  
  console.log('Pattern learned event:', data.metadata?.pattern_type)
})

// Export event emission helpers
export async function emitTaskCompleted(
  userId: string,
  taskId: string,
  wasPredicted: boolean = false,
  predictedCompletion?: number
) {
  await eventBus.emit('TaskCompleted', {
    user_id: userId,
    entity_type: 'task',
    entity_id: taskId,
    metadata: {
      was_predicted: wasPredicted,
      predicted_completion: predictedCompletion,
    },
  })
}

export async function emitHabitChecked(
  userId: string,
  habitId: string,
  streakMaintained: boolean
) {
  await eventBus.emit('HabitChecked', {
    user_id: userId,
    entity_type: 'habit',
    entity_id: habitId,
    metadata: {
      streak_maintained: streakMaintained,
    },
  })
  
  if (streakMaintained) {
    await eventBus.emit('HabitStreakMaintained', {
      user_id: userId,
      entity_type: 'habit',
      entity_id: habitId,
    })
  }
}

export async function emitTimeSessionEnded(
  userId: string,
  sessionId: string,
  taskId: string | null,
  estimatedMinutes: number | null,
  actualMinutes: number
) {
  await eventBus.emit('TimeSessionEnded', {
    user_id: userId,
    entity_type: 'time_session',
    entity_id: sessionId,
    metadata: {
      task_id: taskId,
      estimated_minutes: estimatedMinutes,
      actual_minutes: actualMinutes,
    },
  })
}

export async function emitPlanGenerated(
  userId: string,
  planId: string,
  mode: string,
  date: string
) {
  await eventBus.emit('PlanGenerated', {
    user_id: userId,
    entity_type: 'plan',
    entity_id: planId,
    metadata: {
      mode,
      date,
    },
  })
}

