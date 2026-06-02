'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useNotifications } from '@/hooks/use-notifications'
import { Task } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface NotificationManagerProps {
  tasks: Task[]
  enabled?: boolean
  minutesBefore?: number
}

export function NotificationManager({
  tasks,
  enabled = true,
  minutesBefore = 15,
}: NotificationManagerProps) {
  const { permission, requestPermission, scheduleTaskNotification, cancelNotification } = useNotifications()
  const scheduledNotifications = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const [settings, setSettings] = useState({ enabled: true, minutesBefore: 15 })

  // Load settings from localStorage
  useEffect(() => {
    const savedEnabled = localStorage.getItem('notifications-enabled')
    const savedMinutes = localStorage.getItem('notifications-minutes-before')
    
    setSettings({
      enabled: savedEnabled !== null ? savedEnabled === 'true' : enabled,
      minutesBefore: savedMinutes ? parseInt(savedMinutes) : minutesBefore,
    })
  }, [enabled, minutesBefore])

  // Request permission on mount if enabled
  useEffect(() => {
    if (enabled && !permission.granted && permission.status === 'default') {
      requestPermission()
    }
  }, [enabled, permission, requestPermission])

  // Schedule notifications for tasks
  const scheduleNotifications = useCallback(() => {
    if (!settings.enabled || !permission.granted) {
      return
    }

    const today = formatDate(new Date())
    const now = new Date()

    // Clear existing notifications
    scheduledNotifications.current.forEach((timeoutId) => {
      cancelNotification(timeoutId)
    })
    scheduledNotifications.current.clear()

    // Schedule notifications for today's upcoming tasks
    const upcomingTasks = tasks.filter((task) => {
      if (task.done || !task.start_ts || task.date !== today) {
        return false
      }

      const taskTime = new Date(task.start_ts)
      return taskTime > now
    })

    upcomingTasks.forEach((task) => {
      if (!task.start_ts) return

      // Check for task-specific reminder setting
      let taskReminderMinutes = settings.minutesBefore
      try {
        if (task.detail && task.detail.startsWith('{')) {
          const detailObj = JSON.parse(task.detail)
          if (detailObj.reminderMinutes === 0 || detailObj.reminderMinutes === 'none' || detailObj.reminderMinutes === null) {
            // No reminder for this task
            return
          }
          if (typeof detailObj.reminderMinutes === 'number' && detailObj.reminderMinutes > 0) {
            taskReminderMinutes = detailObj.reminderMinutes
          }
        }
      } catch {
        // If parsing fails, use default
      }

      const timeoutId = scheduleTaskNotification(task, taskReminderMinutes)
      if (timeoutId) {
        scheduledNotifications.current.set(task.id, timeoutId)
      }
    })
  }, [tasks, settings.enabled, settings.minutesBefore, permission.granted, scheduleTaskNotification, cancelNotification])

  // Reschedule when tasks change
  useEffect(() => {
    scheduleNotifications()

    // Capture ref into a local so the cleanup uses the same Map instance the
    // effect ran with — avoids the React lint warning about ref-in-cleanup.
    const notifications = scheduledNotifications.current
    return () => {
      notifications.forEach((timeoutId) => {
        cancelNotification(timeoutId)
      })
      notifications.clear()
    }
  }, [scheduleNotifications, cancelNotification])

  // Reschedule every minute to catch new tasks
  useEffect(() => {
    if (!settings.enabled || !permission.granted) {
      return
    }

    const interval = setInterval(() => {
      scheduleNotifications()
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [settings.enabled, permission.granted, scheduleNotifications])

  return null // This is a headless component
}

