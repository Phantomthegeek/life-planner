'use client'

import { useEffect, useCallback, useState } from 'react'
import { Task } from '@/lib/types'

interface NotificationPermission {
  status: NotificationPermission | 'default'
  granted: boolean
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    status: 'default',
    granted: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    setPermission({
      status: Notification.permission,
      granted: Notification.permission === 'granted',
    })
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      setPermission({ status: 'granted', granted: true })
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const result = await Notification.requestPermission()
    const granted = result === 'granted'
    
    setPermission({ status: result, granted })
    return granted
  }, [])

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!permission.granted) {
        console.warn('Notification permission not granted')
        return null
      }

      if (typeof window === 'undefined' || !('Notification' in window)) {
        return null
      }

      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'task-reminder',
        ...options,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return notification
    },
    [permission.granted]
  )

  const scheduleTaskNotification = useCallback(
    (task: Task, minutesBefore: number = 15) => {
      if (!task.start_ts || !permission.granted) {
        return null
      }

      const taskTime = new Date(task.start_ts)
      const notifyTime = new Date(taskTime.getTime() - minutesBefore * 60 * 1000)
      const now = new Date()
      const delay = notifyTime.getTime() - now.getTime()

      if (delay <= 0) {
        // Task is in the past or very soon, show immediately
        showNotification(`Task Starting: ${task.title}`, {
          body: task.detail || 'Time to start this task!',
          timestamp: taskTime.getTime(),
        })
        return null
      }

      const timeoutId = setTimeout(() => {
        showNotification(`Task Starting Soon: ${task.title}`, {
          body: task.detail || `Starting in ${minutesBefore} minutes at ${taskTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          timestamp: taskTime.getTime(),
          requireInteraction: true,
        })
      }, delay)

      return timeoutId
    },
    [permission.granted, showNotification]
  )

  const cancelNotification = useCallback((timeoutId: NodeJS.Timeout) => {
    clearTimeout(timeoutId)
  }, [])

  return {
    permission,
    requestPermission,
    showNotification,
    scheduleTaskNotification,
    cancelNotification,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  }
}

