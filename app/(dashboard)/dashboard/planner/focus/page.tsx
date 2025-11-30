'use client'

import { PomodoroTimer } from '@/components/focus/pomodoro-timer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTaskStore } from '@/stores/use-task-store'
import { formatDate } from '@/lib/utils'

export default function FocusPage() {
  const { tasks, getTasksByDate } = useTaskStore()
  const [todayTasks, setTodayTasks] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  useEffect(() => {
    const today = formatDate(new Date())
    const todayTasksList = getTasksByDate(today).filter((t) => !t.done)
    setTodayTasks(todayTasksList)
    if (todayTasksList.length > 0 && !selectedTask) {
      setSelectedTask(todayTasksList[0].id)
    }
  }, [tasks, getTasksByDate, selectedTask])

  const currentTask = todayTasks.find((t) => t.id === selectedTask)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/planner">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Focus Mode</h1>
          <p className="text-muted-foreground">
            Stay focused with the Pomodoro technique.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
            {todayTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No pending tasks for today. Great job! 🎉
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

