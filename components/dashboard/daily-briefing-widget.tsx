'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckSquare } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ArcanaTask {
  id: string
  title: string
  done: boolean
}

export function DailyBriefingWidget() {
  const [todaysTasks, setTodaysTasks] = useState<ArcanaTask[]>([])
  const currentDateString = formatDate(new Date())

  useEffect(() => {
    const loadTodaysTasks = async () => {
      try {
        const response = await fetch(`/api/tasks?date=${currentDateString}`)
        if (!response.ok) return
        const taskData = await response.json()
        setTodaysTasks(Array.isArray(taskData) ? taskData : [])
      } catch (err) {
        console.error('Failed to load daily tasks:', err)
      }
    }

    loadTodaysTasks()
  }, [currentDateString])

  const incompleteTasks = todaysTasks.filter((task) => !task.done).slice(0, 3)
  const completedCount = todaysTasks.filter((t) => t.done).length

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Daily Briefing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Upcoming Tasks</h4>
          <div className="space-y-2">
            {incompleteTasks.length > 0 ? (
              incompleteTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm" style={{ minHeight: '1.5rem' }}>
                  <CheckSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{task.title}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {todaysTasks.length === 0
                  ? 'No tasks for today'
                  : 'All tasks completed for today'}
              </p>
            )}
          </div>
          {todaysTasks.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {completedCount} of {todaysTasks.length} done
            </p>
          )}
        </div>

        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/dashboard/coach">Get AI day plan</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
