'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Square, Clock, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface TimerProps {
  taskId?: string
  projectId?: string
  taskTitle?: string
}

export function TimeTracker({ taskId, projectId, taskTitle }: TimerProps) {
  const [active, setActive] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 1000) // Update every second
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (active) {
      const interval = setInterval(() => {
        checkStatus()
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [active])

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/time-tracking/status')
      const data = await response.json()
      
      if (data.active && data.session) {
        setActive(true)
        setElapsed(data.session.elapsed_minutes || 0)
      } else {
        setActive(false)
        setElapsed(0)
      }
    } catch (error) {
      console.error('Error checking status:', error)
    } finally {
      setLoading(false)
    }
  }

  const startTracking = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/time-tracking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId || null,
          project_id: projectId || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start tracking')
      }

      const data = await response.json()
      setActive(true)
      setElapsed(0)

      toast({
        title: 'Time tracking started',
        description: taskTitle ? `Tracking time for: ${taskTitle}` : 'Time tracking is now active',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start tracking',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const stopTracking = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/time-tracking/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error('Failed to stop tracking')
      }

      const data = await response.json()
      setActive(false)
      
      const minutes = data.session?.duration_minutes || 0
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60

      toast({
        title: 'Time tracking stopped',
        description: `Tracked ${hours > 0 ? `${hours}h ` : ''}${mins}m`,
      })

      // Refresh elapsed time
      setElapsed(0)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to stop tracking',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  if (loading && !active) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Time Tracker
        </CardTitle>
        {taskTitle && (
          <CardDescription>{taskTitle}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-mono font-bold mb-2">
            {formatTime(elapsed)}
          </div>
          {active && (
            <p className="text-sm text-muted-foreground">
              Running...
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {!active ? (
            <Button
              onClick={startTracking}
              disabled={loading}
              className="flex-1"
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Timer
            </Button>
          ) : (
            <Button
              onClick={stopTracking}
              disabled={loading}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop Timer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

