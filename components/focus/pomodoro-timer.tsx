'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, RotateCcw, Square } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatTime } from '@/lib/utils'

interface PomodoroTimerProps {
  initialMinutes?: number
  onComplete?: () => void
  taskTitle?: string
}

const DEFAULT_WORK = 25 // minutes
const DEFAULT_SHORT_BREAK = 5
const DEFAULT_LONG_BREAK = 15

export function PomodoroTimer({
  initialMinutes = DEFAULT_WORK,
  onComplete,
  taskTitle,
}: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60) // seconds
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionType, setSessionType] = useState<'work' | 'shortBreak' | 'longBreak'>('work')
  const [completedSessions, setCompletedSessions] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const handleComplete = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsRunning(false)
    setTimeLeft(0)

    const newCompleted = completedSessions + 1
    setCompletedSessions(newCompleted)

    toast({
      title: sessionType === 'work' ? 'Focus Session Complete!' : 'Break Complete!',
      description:
        sessionType === 'work'
          ? 'Great work! Time for a break.'
          : 'Break finished. Ready to focus again?',
    })

    if (onComplete) {
      onComplete()
    }

    // Auto-start break after work session
    if (sessionType === 'work') {
      setTimeout(() => {
        const breakType = newCompleted % 4 === 0 ? 'longBreak' : 'shortBreak'
        setSessionType(breakType)
        setTimeLeft((breakType === 'longBreak' ? DEFAULT_LONG_BREAK : DEFAULT_SHORT_BREAK) * 60)
      }, 2000)
    }
  }

  const start = () => {
    setIsRunning(true)
    setIsPaused(false)
  }

  const pause = () => {
    setIsRunning(false)
    setIsPaused(true)
  }

  const reset = () => {
    setIsRunning(false)
    setIsPaused(false)
    const minutes = sessionType === 'work' 
      ? DEFAULT_WORK 
      : sessionType === 'longBreak' 
      ? DEFAULT_LONG_BREAK 
      : DEFAULT_SHORT_BREAK
    setTimeLeft(minutes * 60)
  }

  const stop = () => {
    setIsRunning(false)
    setIsPaused(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const switchSession = (type: 'work' | 'shortBreak' | 'longBreak') => {
    stop()
    setSessionType(type)
    const minutes = type === 'work' 
      ? DEFAULT_WORK 
      : type === 'longBreak' 
      ? DEFAULT_LONG_BREAK 
      : DEFAULT_SHORT_BREAK
    setTimeLeft(minutes * 60)
  }

  const totalSeconds = sessionType === 'work' 
    ? DEFAULT_WORK * 60 
    : sessionType === 'longBreak' 
    ? DEFAULT_LONG_BREAK * 60 
    : DEFAULT_SHORT_BREAK * 60
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Focus Timer</span>
          {completedSessions > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              {completedSessions} session{completedSessions !== 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
        {taskTitle && (
          <p className="text-sm text-muted-foreground">{taskTitle}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center gap-2">
          <Button
            variant={sessionType === 'work' ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchSession('work')}
          >
            Work ({DEFAULT_WORK}m)
          </Button>
          <Button
            variant={sessionType === 'shortBreak' ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchSession('shortBreak')}
          >
            Short ({DEFAULT_SHORT_BREAK}m)
          </Button>
          <Button
            variant={sessionType === 'longBreak' ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchSession('longBreak')}
          >
            Long ({DEFAULT_LONG_BREAK}m)
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="text-6xl font-bold tabular-nums">
            {formatTime(minutes)}:{formatTime(seconds)}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex justify-center gap-2">
          {!isRunning && !isPaused && (
            <Button onClick={start} size="lg">
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          )}
          {isRunning && (
            <Button onClick={pause} variant="outline" size="lg">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
          {isPaused && (
            <Button onClick={start} size="lg">
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          )}
          {(isRunning || isPaused) && (
            <>
              <Button onClick={reset} variant="outline" size="lg">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={stop} variant="outline" size="lg">
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

