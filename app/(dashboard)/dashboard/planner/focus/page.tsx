'use client'

import { PomodoroTimer } from '@/components/focus/pomodoro-timer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'

// Flow Mode / Focus page - Pomodoro timer for focused work sessions
// Fetches today's tasks directly from API instead of using store
export default function FocusPage() {
  const [todayTasks, setTodayTasks] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch today's tasks from API
    const today = formatDate(new Date())
    fetch(`/api/tasks?date=${today}`)
      .then((res) => res.json())
      .then((data) => {
        const incomplete = Array.isArray(data) ? data.filter((t: any) => !t.done) : []
        setTodayTasks(incomplete)
        if (incomplete.length > 0 && !selectedTask) {
          setSelectedTask(incomplete[0].id)
        }
      })
      .catch((err) => {
        console.error('Failed to load tasks:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [selectedTask])

  const currentTask = todayTasks.find((t) => t.id === selectedTask)

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/dashboard/planner">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Flow Mode</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Stay focused with the Pomodoro technique.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        <PomodoroTimer
          initialMinutes={25}
          taskTitle={currentTask?.title}
          onComplete={() => {
            // Auto-complete task when focus session is done (optional)
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today&apos;s Tasks
            </CardTitle>
            <CardDescription>Select a task to focus on</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading tasks...</p>
            ) : todayTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No pending tasks for today. Great job!
              </p>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTask === task.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedTask(task.id)}
                  >
                    <div className="font-medium">{task.title}</div>
                    {task.category && (
                      <span className="text-xs text-muted-foreground">
                        {task.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
