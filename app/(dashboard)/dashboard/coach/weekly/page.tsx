'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Loader2, Calendar, Sparkles, Moon, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate, addDays } from '@/lib/utils'
import { AICoachResponse } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface WeeklyPlan {
  date: string
  plan: AICoachResponse
}

export default function WeeklyCoachingPage() {
  const [loading, setLoading] = useState(false)
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([])
  const [mode, setMode] = useState<'normal' | 'light' | 'intense'>('normal')
  const [startDate, setStartDate] = useState(formatDate(new Date()))
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  const generateWeeklyPlan = async (planMode: 'normal' | 'light' | 'intense' = mode) => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/weekly-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          mode: planMode,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate weekly plan')
      }

      const data = await response.json()
      setWeeklyPlans(data.plans || [])
      setDialogOpen(true)

      toast({
        title: 'Weekly Plan Generated!',
        description: 'Your AI-generated weekly plan is ready.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate weekly plan',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const applyWeeklySchedule = async () => {
    if (!weeklyPlans.length) return

    try {
      // Create tasks for each day
      const tasks = weeklyPlans.flatMap(({ date, plan }) =>
        plan.schedule.map((item) => ({
          title: item.title,
          detail: item.notes || null,
          date,
          start_ts: item.start,
          end_ts: item.end,
          duration_minutes: Math.round(
            (new Date(item.end).getTime() - new Date(item.start).getTime()) /
              (1000 * 60)
          ),
          category: item.category,
        }))
      )

      // Create all tasks
      const promises = tasks.map((task) =>
        fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        })
      )

      await Promise.all(promises)

      toast({
        title: 'Weekly Schedule Applied!',
        description: 'Your tasks have been added to your calendar.',
      })

      setDialogOpen(false)
      window.location.href = '/dashboard/planner'
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply schedule',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weekly AI Planning</h1>
        <p className="text-muted-foreground">
          Get your personalized weekly plan optimized by AI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Configuration</CardTitle>
          <CardDescription>
            Set your preferences for the weekly plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Week Starting</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Normal Week
            </CardTitle>
            <CardDescription>
              A balanced schedule for your typical week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => generateWeeklyPlan('normal')}
              disabled={loading}
            >
              {loading && mode === 'normal' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Brain className="mr-2 h-4 w-4" />
              )}
              Generate Plan
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-blue-500" />
              Light Week
            </CardTitle>
            <CardDescription>
              Easier schedule with more breaks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => generateWeeklyPlan('light')}
              disabled={loading}
            >
              {loading && mode === 'light' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              Make It Lighter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Intense Week
            </CardTitle>
            <CardDescription>
              Maximum productivity week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => generateWeeklyPlan('intense')}
              disabled={loading}
            >
              {loading && mode === 'intense' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Make It Intense
            </Button>
          </CardContent>
        </Card>
      </div>

      {weeklyPlans.length > 0 && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Your Weekly AI-Generated Plan</DialogTitle>
              <DialogDescription>
                {startDate} - {formatDate(addDays(new Date(startDate), 6))}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {weeklyPlans.map(({ date, plan }, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </CardTitle>
                    <CardDescription>{plan.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {plan.schedule.slice(0, 5).map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-2 rounded border text-sm"
                        >
                          <span className="text-muted-foreground min-w-[80px]">
                            {new Date(item.start).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium">{item.title}</div>
                            <span className="text-xs text-muted-foreground">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      ))}
                      {plan.schedule.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{plan.schedule.length - 5} more items
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={applyWeeklySchedule} className="flex-1">
                Apply to Calendar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

