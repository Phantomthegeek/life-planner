'use client'

import { useState } from 'react'
import { DailyTimetable } from '@/components/planner/daily-timetable'
import { NotificationManager } from '@/components/notifications/notification-manager'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useTaskStore } from '@/stores/use-task-store'
import { useEffect } from 'react'

export default function TimetablePage() {
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()))
  const { tasks } = useTaskStore()

  const handleTaskClick = (task: any) => {
    // Could open task dialog here
    console.log('Task clicked:', task)
  }

  const handleTaskToggle = async (task: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          done: !task.done,
        }),
      })

      if (!response.ok) throw new Error('Failed to toggle task')
      
      const updated = await response.json()
      useTaskStore.getState().updateTask(task.id, updated)
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  // Fetch tasks on mount and refresh periodically
  const fetchTasks = async () => {
    try {
      // Fetch a wider date range to include all study tasks
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 13) // Fetch 2 weeks ahead to catch study plans

      const response = await fetch(
        `/api/tasks?startDate=${formatDate(weekStart)}&endDate=${formatDate(weekEnd)}`
      )
      if (response.ok) {
        const data = await response.json()
        useTaskStore.getState().setTasks(data)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    }
  }

  useEffect(() => {
    fetchTasks()
    
    // Refresh on window focus (when user navigates back)
    const handleFocus = () => {
      fetchTasks()
    }
    window.addEventListener('focus', handleFocus)

    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Timetable</h1>
          <p className="text-muted-foreground">
            View your day in a detailed time-blocked schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/planner">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar View
            </Button>
          </Link>
        </div>
      </div>

      <NotificationManager tasks={tasks} enabled={true} minutesBefore={15} />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const prev = new Date(currentDate)
                prev.setDate(prev.getDate() - 1)
                setCurrentDate(formatDate(prev))
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const next = new Date(currentDate)
                next.setDate(next.getDate() + 1)
                setCurrentDate(formatDate(next))
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(formatDate(new Date()))}
            >
              Today
            </Button>
          </div>
        </div>

        <DailyTimetable
          tasks={tasks}
          date={currentDate}
          onTaskClick={handleTaskClick}
          onTaskToggle={handleTaskToggle}
        />
      </div>
    </div>
  )
}
