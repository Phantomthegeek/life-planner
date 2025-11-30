'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Task } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Clock, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DailyTimetableProps {
  tasks: Task[]
  date: string
  onTaskClick?: (task: Task) => void
  onTaskToggle?: (task: Task) => void
}

const hours = Array.from({ length: 24 }, (_, i) => i)

export function DailyTimetable({
  tasks,
  date,
  onTaskClick,
  onTaskToggle,
}: DailyTimetableProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null)

  // Filter tasks for this date
  const dayTasks = useMemo(() => {
    return tasks.filter((task) => task.date === date).sort((a, b) => {
      if (!a.start_ts || !b.start_ts) return 0
      return new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime()
    })
  }, [tasks, date])

  // Group tasks by hour
  const tasksByHour = useMemo(() => {
    const grouped: Record<number, Task[]> = {}
    
    dayTasks.forEach((task) => {
      if (task.start_ts) {
        const taskHour = new Date(task.start_ts).getHours()
        if (!grouped[taskHour]) {
          grouped[taskHour] = []
        }
        grouped[taskHour].push(task)
      }
    })
    
    return grouped
  }, [dayTasks])

  const getTaskStyle = (task: Task) => {
    const start = task.start_ts ? new Date(task.start_ts) : null
    const end = task.end_ts ? new Date(task.end_ts) : null
    
    if (!start || !end) return {}

    const startHour = start.getHours()
    const startMinute = start.getMinutes()
    const endHour = end.getHours()
    const endMinute = end.getMinutes()
    
    // Calculate position as percentage of hour
    const topPercent = (startMinute / 60) * 100
    const duration = (end.getTime() - start.getTime()) / (1000 * 60) // minutes
    const heightPercent = (duration / 60) * 100

    return {
      top: `${topPercent}%`,
      height: `${Math.max(heightPercent, 5)}%`, // Minimum 5% height
    }
  }

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'work':
        return 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-700'
      case 'study':
        return 'bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-700'
      case 'personal':
        return 'bg-purple-500 dark:bg-purple-600 border-purple-600 dark:border-purple-700'
      case 'break':
        return 'bg-yellow-500 dark:bg-yellow-600 border-yellow-600 dark:border-yellow-700'
      case 'habit':
        return 'bg-pink-500 dark:bg-pink-600 border-pink-600 dark:border-pink-700'
      default:
        return 'bg-gray-500 dark:bg-gray-600 border-gray-600 dark:border-gray-700'
    }
  }

  const currentHour = new Date().getHours()
  const currentMinute = new Date().getMinutes()
  const isToday = date === formatDate(new Date())

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Daily Timetable - {new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-y-auto max-h-[600px] border rounded-lg">
          <div className="flex gap-0">
            {/* Hour Labels */}
            <div className="w-20 flex-shrink-0 border-r bg-muted/30">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 border-b p-2 flex items-start justify-end text-sm text-muted-foreground sticky top-0 bg-background"
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative flex-1">
              {hours.map((hour) => {
                const hourTasks = tasksByHour[hour] || []
                const isCurrentHour = isToday && hour === currentHour
                const isPastHour = isToday && hour < currentHour
                const isFutureHour = isToday && hour > currentHour

                return (
                  <div
                    key={hour}
                    className={cn(
                      'relative h-16 border-b border-l',
                      isCurrentHour && 'bg-primary/5',
                      isPastHour && 'bg-muted/30',
                      isFutureHour && 'bg-background'
                    )}
                    onClick={() => setSelectedHour(selectedHour === hour ? null : hour)}
                  >
                    {/* Current Time Indicator */}
                    {isCurrentHour && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{
                          top: `${(currentMinute / 60) * 100}%`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-0.5 bg-red-500 flex-1" />
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                      </div>
                    )}

                    {/* Tasks in this hour */}
                    {hourTasks.map((task) => {
                      const style = getTaskStyle(task)
                      const startTime = task.start_ts
                        ? new Date(task.start_ts).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : null
                      const endTime = task.end_ts
                        ? new Date(task.end_ts).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : null

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            'absolute left-1 right-1 rounded border-l-4 p-2 cursor-pointer hover:shadow-md transition-all overflow-hidden',
                            getCategoryColor(task.category || 'work'),
                            task.done && 'opacity-50 line-through'
                          )}
                          style={{
                            top: style.top,
                            height: style.height,
                            minHeight: '40px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onTaskClick?.(task)
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onTaskToggle?.(task)
                              }}
                              className="mt-0.5"
                            >
                              {task.done ? (
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              ) : (
                                <Circle className="h-4 w-4 text-white/70" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">
                                {task.title}
                              </div>
                              {(startTime || endTime) && (
                                <div className="text-xs text-white/80">
                                  {startTime} {endTime && `- ${endTime}`}
                                </div>
                              )}
                              {task.detail && (
                                <div className="text-xs text-white/70 line-clamp-1 mt-1">
                                  {task.detail}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span>Work</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Study</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500" />
            <span>Personal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span>Break</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-pink-500" />
            <span>Habit</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

