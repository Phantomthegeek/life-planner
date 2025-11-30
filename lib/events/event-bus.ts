/**
 * Event-Driven System for Little Einstein
 * Enables plugins, workflows, and powerful automation
 */

export type SystemEvent =
  | 'TaskCreated'
  | 'TaskCompleted'
  | 'TaskSkipped'
  | 'TaskUpdated'
  | 'TaskDeleted'
  | 'HabitChecked'
  | 'HabitStreakBroken'
  | 'HabitStreakMaintained'
  | 'TimeSessionStarted'
  | 'TimeSessionEnded'
  | 'ModuleCompleted'
  | 'PlanGenerated'
  | 'PatternLearned'
  | 'AutomationTriggered'
  | 'GoalProgressed'
  | 'GoalCompleted'
  | 'ProjectProgressed'
  | 'MilestoneCompleted'
  | 'NoteCreated'
  | 'CertificationProgressed'
  | 'AchievementUnlocked'
  | 'UserLoggedIn'
  | 'WeeklySummaryGenerated'

export interface EventData {
  user_id: string
  entity_type?: string
  entity_id?: string
  metadata?: Record<string, any>
  timestamp?: string
}

type EventHandler = (data: EventData) => void | Promise<void>

class EventBus {
  private handlers: Map<SystemEvent, Set<EventHandler>> = new Map()
  private eventLog: Array<{ event: SystemEvent; data: EventData; timestamp: string }> = []

  /**
   * Emit an event
   */
  async emit(event: SystemEvent, data: EventData): Promise<void> {
    // Add timestamp if not present
    const eventData = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    }

    // Log event
    this.eventLog.push({
      event,
      data: eventData,
      timestamp: eventData.timestamp,
    })

    // Keep only last 1000 events in memory
    if (this.eventLog.length > 1000) {
      this.eventLog.shift()
    }

    // Call all handlers
    const handlers = this.handlers.get(event) || new Set()
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(eventData)
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error)
      }
    })

    await Promise.all(promises)

    // Also save to database (async, don't wait)
    this.saveToDatabase(event, eventData).catch((error) => {
      console.error('Error saving event to database:', error)
    })
  }

  /**
   * Subscribe to an event
   */
  subscribe(event: SystemEvent, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }

    this.handlers.get(event)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(event: SystemEvent, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler)
  }

  /**
   * Get event history
   */
  getEventHistory(event?: SystemEvent, limit: number = 100): Array<{ event: SystemEvent; data: EventData; timestamp: string }> {
    let events = this.eventLog

    if (event) {
      events = events.filter((e) => e.event === event)
    }

    return events.slice(-limit)
  }

  /**
   * Save event to database (async)
   */
  private async saveToDatabase(event: SystemEvent, data: EventData): Promise<void> {
    // This would save to the system_events table
    // For now, we'll just log it
    // In production, this would make an API call or use Supabase directly
    if (typeof window === 'undefined') {
      // Server-side: can save directly
      try {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = createClient()
        
        await supabase.from('system_events').insert({
          event_type: event,
          user_id: data.user_id,
          entity_type: data.entity_type || null,
          entity_id: data.entity_id || null,
          event_data: data.metadata || {},
        })
      } catch (error) {
        // Silently fail - events are non-critical
        console.error('Failed to save event to database:', error)
      }
    }
  }
}

// Singleton instance
export const eventBus = new EventBus()

// Pre-defined event handlers for built-in functionality

// Auto-update project progress when task completed
eventBus.subscribe('TaskCompleted', async (data) => {
  if (data.entity_type === 'task' && data.entity_id) {
    // This will be handled by database triggers, but we can add client-side logic here
    console.log('Task completed:', data.entity_id)
  }
})

// Award XP when task completed
eventBus.subscribe('TaskCompleted', async (data) => {
  // XP awarding logic would go here
  console.log('Awarding XP for task completion')
})

// Update patterns when task completed
eventBus.subscribe('TaskCompleted', async (data) => {
  // Trigger pattern learning
  console.log('Triggering pattern learning')
})

export default eventBus

