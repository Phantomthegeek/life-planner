'use client'

import { useEffect } from 'react'
import { useTaskStore } from '@/stores/use-task-store'
import { NotificationManager } from '@/components/notifications/notification-manager'
import { formatDate } from '@/lib/utils'

export function DashboardLayoutClient() {
  const { tasks, setTasks } = useTaskStore()

  useEffect(() => {
    // Fetch tasks for today and upcoming week
    const fetchTasks = async () => {
      try {
        const today = formatDate(new Date())
        const weekEnd = new Date()
        weekEnd.setDate(weekEnd.getDate() + 7)

        const response = await fetch(
          `/api/tasks?startDate=${today}&endDate=${formatDate(weekEnd)}`
        )
        
        if (response.ok) {
          const data = await response.json()
          setTasks(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        // Fail silently - tasks just won't load
        console.error('Failed to fetch tasks:', error)
      }
    }

    fetchTasks()

    // Refresh tasks every 5 minutes
    const interval = setInterval(fetchTasks, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [setTasks])

  return <NotificationManager tasks={tasks} enabled={true} minutesBefore={15} />
}

