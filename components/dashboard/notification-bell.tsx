'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, BellOff, Clock } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useTaskStore } from '@/stores/use-task-store'
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'
import type { Task } from '@/lib/types'

// Show "upcoming" tasks if they start within this window from now.
const UPCOMING_WINDOW_HOURS = 12

interface UpcomingTask {
  id: string
  title: string
  start_ts: string
  minutesAway: number
}

function pickUpcomingTasks(tasks: Task[]): UpcomingTask[] {
  const now = Date.now()
  const cutoff = now + UPCOMING_WINDOW_HOURS * 60 * 60 * 1000
  return tasks
    .filter((task) => !task.done && task.start_ts)
    .map((task) => {
      const startMs = new Date(task.start_ts as string).getTime()
      return {
        id: task.id,
        title: task.title,
        start_ts: task.start_ts as string,
        minutesAway: Math.round((startMs - now) / 60000),
      }
    })
    .filter((t) => t.minutesAway > 0 && new Date(t.start_ts).getTime() <= cutoff)
    .sort((a, b) => a.minutesAway - b.minutesAway)
    .slice(0, 5)
}

function formatTimeAway(minutes: number): string {
  if (minutes < 60) return `in ${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (remainder === 0) return `in ${hours}h`
  return `in ${hours}h ${remainder}m`
}

export function NotificationBell() {
  const { tasks } = useTaskStore()
  const { permission, requestPermission, isSupported } = useNotifications()
  const [open, setOpen] = useState(false)
  const [upcoming, setUpcoming] = useState<UpcomingTask[]>([])

  // Recompute upcoming list whenever tasks change. We also rerun every minute
  // so "in 12m" actually counts down without a page refresh.
  useEffect(() => {
    setUpcoming(pickUpcomingTasks(tasks))
    const interval = setInterval(() => setUpcoming(pickUpcomingTasks(tasks)), 60_000)
    return () => clearInterval(interval)
  }, [tasks])

  // Show a dot if there's anything to show, OR if browser perms haven't been
  // decided yet — that's a soft nudge to enable notifications.
  const needsPermission = isSupported && permission.status === 'default'
  const showDot = upcoming.length > 0 || needsPermission

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {showDot && (
            <span
              className={cn(
                'absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full',
                needsPermission ? 'bg-yellow-500' : 'bg-blue-500'
              )}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={8}
        className="w-[calc(100vw-1rem)] max-w-sm sm:w-80 p-0"
      >
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Upcoming</p>
            <p className="text-xs text-muted-foreground">
              Next {UPCOMING_WINDOW_HOURS} hours
            </p>
          </div>
          {permission.granted && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Bell className="h-3 w-3" /> on
            </span>
          )}
        </div>

        {needsPermission && (
          <div className="p-3 border-b border-border bg-yellow-500/5">
            <p className="text-xs mb-2">
              Browser notifications are off. Turn them on to get pinged before tasks start.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={async () => {
                await requestPermission()
              }}
            >
              Enable
            </Button>
          </div>
        )}

        {!isSupported && (
          <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <BellOff className="h-4 w-4" />
            Not supported in this browser
          </div>
        )}

        {upcoming.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nothing scheduled in the next {UPCOMING_WINDOW_HOURS} hours.
          </div>
        ) : (
          <ul className="divide-y divide-border max-h-80 overflow-y-auto">
            {upcoming.map((task) => (
              <li key={task.id}>
                <Link
                  href="/dashboard/planner/timetable"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAway(task.minutesAway)} ·{' '}
                      {new Date(task.start_ts).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="p-2 border-t border-border">
          <Link
            href="/dashboard/settings/notifications"
            onClick={() => setOpen(false)}
            className="block text-xs text-center text-muted-foreground hover:text-foreground py-1.5 transition-colors"
          >
            Notification settings
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
