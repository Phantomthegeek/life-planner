'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Sparkles, Moon, Zap, Loader2, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AICoachResponse, AIScheduleItem } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export default function CoachPage() {
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<AICoachResponse | null>(null)
  const [mode, setMode] = useState<'normal' | 'light' | 'intense'>('normal')
  const [date, setDate] = useState(formatDate(new Date()))
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  const generatePlan = async (planMode: 'normal' | 'light' | 'intense' = mode) => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          mode: planMode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setPlan(data)
      setDialogOpen(true)

      toast({
        title: 'Plan Generated!',
        description: 'Your AI-generated daily plan is ready.',
      })
    } catch (error: any) {
      console.error('AI Coach Error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate plan. Please check the console for details.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const applySchedule = async () => {
    if (!plan) return

    try {
      const tasks = plan.schedule.map((item) => ({
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
        title: 'Schedule Applied!',
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI Life Coach
          </h1>
          <p className="text-muted-foreground text-lg">
            Get your personalized daily plan optimized by AI.
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/dashboard/coach/weekly-review">
            <Sparkles className="mr-2 h-4 w-4" />
            Weekly Review
          </a>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="card-hover border-2 hover:border-primary/50 bg-gradient-to-br from-primary/5 to-transparent transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              Normal Day
            </CardTitle>
            <CardDescription className="text-base">
              A balanced schedule for your typical day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full shadow-lg"
              onClick={() => generatePlan('normal')}
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

        <Card className="card-hover border-2 hover:border-blue-500/50 bg-gradient-to-br from-blue-500/5 to-transparent transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Moon className="h-5 w-5 text-blue-500" />
              </div>
              Light Day
            </CardTitle>
            <CardDescription className="text-base">
              Easier schedule with more breaks and recovery time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => generatePlan('light')}
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

        <Card className="card-hover border-2 hover:border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-transparent transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Zap className="h-5 w-5 text-yellow-500" />
              </div>
              Intense Day
            </CardTitle>
            <CardDescription className="text-base">
              Maximum productivity with packed schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => generatePlan('intense')}
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

      {plan && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Your AI-Generated Daily Plan</DialogTitle>
              <DialogDescription>{date}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground">{plan.summary}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Schedule</h3>
                <div className="space-y-2">
                  {plan.schedule.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.start).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(item.end).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {item.notes && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.notes}
                          </div>
                        )}
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-secondary">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {plan.actions && plan.actions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Action Items</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {plan.actions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.motivation && (
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-sm font-medium">{plan.motivation}</p>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Total estimated time: {plan.estimates.total_minutes} minutes
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  setMode('normal')
                  try {
                    const response = await fetch('/api/ai/rewrite-day', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ date, mode: 'normal' }),
                    })
                    if (!response.ok) throw new Error('Failed to rewrite day')
                    const newPlan = await response.json()
                    setPlan(newPlan)
                    toast({
                      title: 'Day Rewritten!',
                      description: 'Your schedule has been completely refreshed.',
                    })
                  } catch (error: any) {
                    toast({
                      title: 'Error',
                      description: error.message || 'Failed to rewrite day',
                      variant: 'destructive',
                    })
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
              >
                <Zap className="mr-2 h-4 w-4" />
                Rewrite My Day
              </Button>
              <Button onClick={applySchedule} className="flex-1">
                Apply to Calendar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

