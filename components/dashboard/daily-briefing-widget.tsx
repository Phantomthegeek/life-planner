'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

// Task data structure - matches our Supabase schema
interface ArcanaTask {
  id: string
  title: string
  done: boolean
}

// Daily Briefing widget - shows today's tasks and suggested focus
// This widget is intentionally simple - we fetch tasks but don't show loading states
// Trade-off: brief flash of empty state is acceptable for faster perceived performance
export function DailyBriefingWidget() {
  const [todaysTasks, setTodaysTasks] = useState<ArcanaTask[]>([])
  const currentDateString = formatDate(new Date())

  useEffect(() => {
    // Fetch today's tasks from API
    // Using fetch instead of a hook - keeps this component lightweight
    // Could use React Query here, but this is simple enough that fetch is fine
    const loadTodaysTasks = async () => {
      try {
        const response = await fetch(`/api/tasks?date=${currentDateString}`)
        if (!response.ok) {
          // Silently fail - empty state is handled in render
          return
        }
        const taskData = await response.json()
        setTodaysTasks(Array.isArray(taskData) ? taskData : [])
      } catch (err) {
        // Error handling: just don't update state, show empty state
        // This is a non-critical widget, so failing gracefully is fine
        console.error('Failed to load daily tasks:', err)
      }
    }

    loadTodaysTasks()
  }, [currentDateString])

  // Filter to only incomplete tasks, limit to 3 for the widget
  const incompleteTasks = todaysTasks
    .filter((task) => !task.done)
    .slice(0, 3)

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Daily Briefing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upcoming tasks section */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Upcoming Tasks</h4>
          <div className="space-y-2">
            {incompleteTasks.length > 0 ? (
              incompleteTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center gap-2 text-sm"
                  // Adding min-height prevents layout shift when tasks load
                  style={{ minHeight: '1.5rem' }}
                >
                  <CheckSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span 
                    className={cn(
                      'truncate', // Prevents long task titles from breaking layout
                      task.done ? 'line-through text-gray-400' : ''
                    )}
                  >
                    {task.title}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">No upcoming tasks</p>
            )}
          </div>
        </div>

        {/* Suggested focus section - placeholder for now */}
        {/* The gray boxes are intentional placeholders - will be replaced with actual AI suggestions */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Suggested Focus</h4>
          <div className="space-y-2">
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
