'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Habit } from '@/lib/types'
import { rewardHabitCompletion } from '@/lib/gamification-actions'
import { useToast } from '@/hooks/use-toast'

export function TodaysHabitsWidget() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadHabits = async () => {
    try {
      const res = await fetch('/api/habits')
      if (res.ok) {
        const data = await res.json()
        setHabits(Array.isArray(data) ? data.slice(0, 5) : [])
      }
    } catch {
      // non-critical widget
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHabits()
  }, [])

  const isCompletedToday = (habit: Habit) =>
    habit.last_done === formatDate(new Date())

  const handleCheck = async (habit: Habit) => {
    if (isCompletedToday(habit)) return

    try {
      const res = await fetch('/api/habits/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: habit.id }),
      })
      if (!res.ok) throw new Error('Failed to complete habit')

      const updated = await res.json()
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? updated : h)))
      rewardHabitCompletion()
      toast({ title: 'Habit done!', description: habit.name })
    } catch {
      toast({
        title: 'Error',
        description: 'Could not save habit check-in',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Today&apos;s Habits</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/habits">Manage</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : habits.length > 0 ? (
          <div className="space-y-2">
            {habits.map((habit) => {
              const done = isCompletedToday(habit)
              return (
                <label
                  key={habit.id}
                  className="flex items-center gap-2 text-sm cursor-pointer rounded-md p-2 hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={done}
                    disabled={done}
                    onChange={() => handleCheck(habit)}
                  />
                  <span className={done ? 'line-through text-muted-foreground' : ''}>
                    {habit.name}
                  </span>
                  {(habit.streak ?? 0) > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      🔥 {habit.streak}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">No habits yet</p>
            <Button size="sm" asChild>
              <Link href="/dashboard/habits">Create a habit</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
