'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Moon, Zap, Loader2, Calendar, Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AICoachResponse, AIScheduleItem } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const CATEGORY_OPTIONS = ['study', 'work', 'break', 'habit', 'personal'] as const

function toTimeInput(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function timeInputToISO(date: string, time: string): string {
  return `${date}T${time}:00`
}

export default function CoachPage() {
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<AICoachResponse | null>(null)
  const [mode, setMode] = useState<'normal' | 'light' | 'intense'>('normal')
  const [date, setDate] = useState(formatDate(new Date()))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [draftItem, setDraftItem] = useState<AIScheduleItem | null>(null)
  const { toast } = useToast()

  const startEdit = (idx: number) => {
    if (!plan) return
    setEditingIdx(idx)
    setDraftItem({ ...plan.schedule[idx] })
  }

  const cancelEdit = () => {
    setEditingIdx(null)
    setDraftItem(null)
  }

  const saveEdit = () => {
    if (!plan || editingIdx === null || !draftItem) return
    if (!draftItem.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' })
      return
    }
    if (new Date(draftItem.end) <= new Date(draftItem.start)) {
      toast({ title: 'End time must be after start', variant: 'destructive' })
      return
    }
    const next = [...plan.schedule]
    next[editingIdx] = draftItem
    setPlan({ ...plan, schedule: next })
    cancelEdit()
  }

  const removeItem = (idx: number) => {
    if (!plan) return
    const next = plan.schedule.filter((_, i) => i !== idx)
    setPlan({ ...plan, schedule: next })
    if (editingIdx === idx) cancelEdit()
  }

  const addBlankItem = () => {
    if (!plan) return
    const start = `${date}T12:00:00`
    const end = `${date}T13:00:00`
    const next: AIScheduleItem = {
      title: 'New task',
      start,
      end,
      category: 'personal',
      notes: '',
    }
    setPlan({ ...plan, schedule: [...plan.schedule, next] })
    setEditingIdx(plan.schedule.length)
    setDraftItem(next)
  }

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Daily plan</h1>
          <p className="text-muted-foreground mt-1">
            Pick a mode. Arcana drafts a schedule. You edit it before it lands on your calendar.
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/dashboard/coach/weekly-review">Weekly review</a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Normal day</CardTitle>
            <CardDescription>Balanced mix of focus, breaks, and habits.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => generatePlan('normal')}
              disabled={loading}
            >
              {loading && mode === 'normal' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Moon className="h-4 w-4 text-muted-foreground" />
              Light day
            </CardTitle>
            <CardDescription>Fewer blocks, longer breaks, recovery time.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => generatePlan('light')}
              disabled={loading}
            >
              {loading && mode === 'light' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Make it lighter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Intense day
            </CardTitle>
            <CardDescription>Packed schedule for when you need to ship.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => generatePlan('intense')}
              disabled={loading}
            >
              {loading && mode === 'intense' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Make it intense
            </Button>
          </CardContent>
        </Card>
      </div>

      {plan && (
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) cancelEdit()
          }}
        >
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Schedule</h3>
                  <Button size="sm" variant="ghost" onClick={addBlankItem}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add block
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Tweak anything before applying — Arcana&apos;s suggestions, your call.
                </p>
                <div className="space-y-2">
                  {plan.schedule.length === 0 && (
                    <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                      Empty schedule. Add a block or regenerate.
                    </div>
                  )}
                  {plan.schedule.map((item, idx) => {
                    const isEditing = editingIdx === idx && draftItem
                    if (isEditing && draftItem) {
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border-2 border-primary/50 bg-primary/5 space-y-3"
                        >
                          <div className="space-y-1.5">
                            <Label className="text-xs">Title</Label>
                            <Input
                              value={draftItem.title}
                              onChange={(e) =>
                                setDraftItem({ ...draftItem, title: e.target.value })
                              }
                              placeholder="e.g. Deep work on TypeScript types"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Start</Label>
                              <Input
                                type="time"
                                value={toTimeInput(draftItem.start)}
                                onChange={(e) =>
                                  setDraftItem({
                                    ...draftItem,
                                    start: timeInputToISO(date, e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">End</Label>
                              <Input
                                type="time"
                                value={toTimeInput(draftItem.end)}
                                onChange={(e) =>
                                  setDraftItem({
                                    ...draftItem,
                                    end: timeInputToISO(date, e.target.value),
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Category</Label>
                            <Select
                              value={draftItem.category}
                              onValueChange={(v) =>
                                setDraftItem({ ...draftItem, category: v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORY_OPTIONS.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Notes (optional)</Label>
                            <Textarea
                              value={draftItem.notes || ''}
                              onChange={(e) =>
                                setDraftItem({ ...draftItem, notes: e.target.value })
                              }
                              rows={2}
                              placeholder="Anything you want to remember about this block"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={cancelEdit}>
                              <X className="mr-1 h-3.5 w-3.5" /> Cancel
                            </Button>
                            <Button size="sm" onClick={saveEdit}>
                              <Check className="mr-1 h-3.5 w-3.5" /> Save
                            </Button>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div
                        key={idx}
                        className="group flex items-start gap-3 p-3 rounded-lg border hover:border-primary/50 transition-colors"
                      >
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
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
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => startEdit(idx)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeItem(idx)}
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
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

