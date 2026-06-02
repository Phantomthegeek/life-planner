'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb } from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatDateToISO } from '@/lib/utils'
import Link from 'next/link'

export function SuggestedFocusWidget() {
  const [suggestedTask, setSuggestedTask] = useState<string | null>(null)
  const [taskCount, setTaskCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const today = formatDateToISO(new Date())
        const response = await fetch(`/api/tasks?date=${today}`)
        if (response.ok) {
          const tasks = await response.json()
          if (Array.isArray(tasks)) {
            setTaskCount(tasks.length)
            const incomplete = tasks.filter((t: { done?: boolean }) => !t.done)
            if (incomplete.length > 0) {
              setSuggestedTask(incomplete[0].title)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load suggested focus:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <Card className="col-span-1 border-2 border-[#FFBD44]/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[#FFBD44]" />
            Suggested Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 border-2 border-[#FFBD44]/20 hover:border-[#FFBD44]/40 transition-colors">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[#FFBD44]" />
          Suggested Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedTask ? (
          <>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {suggestedTask}
            </p>
            <p className="text-xs text-muted-foreground">
              Your first incomplete task for today ({taskCount} total today).
            </p>
            <Button size="sm" className="w-full" asChild>
              <Link href="/dashboard/planner">Open in planner</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {taskCount === 0
                ? 'No tasks scheduled for today.'
                : 'All tasks for today are done — nice work!'}
            </p>
            <Button size="sm" variant="outline" className="w-full" asChild>
              <Link href="/dashboard/planner">Add a task</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
