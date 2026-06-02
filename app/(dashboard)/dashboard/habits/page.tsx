'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Target, Flame, Trophy, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Habit } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { rewardHabitCompletion } from '@/lib/gamification-actions'

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchHabits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits')
      if (!response.ok) throw new Error('Failed to fetch habits')
      const data = await response.json()
      setHabits(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load habits',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) {
      toast({
        title: 'Error',
        description: 'Habit name is required',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHabitName.trim() }),
      })

      if (!response.ok) throw new Error('Failed to create habit')

      const habit = await response.json()
      setHabits([...habits, habit])
      setNewHabitName('')
      setDialogOpen(false)

      toast({
        title: 'Success',
        description: 'Habit created successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create habit',
        variant: 'destructive',
      })
    }
  }

  const handleCompleteHabit = async (habit: Habit) => {
    try {
      const response = await fetch('/api/habits/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: habit.id }),
      })

      if (!response.ok) throw new Error('Failed to complete habit')

      const updated = await response.json()
      setHabits(habits.map((h) => (h.id === habit.id ? updated : h)))
      rewardHabitCompletion()

      toast({
        title: 'Great job!',
        description: `You've completed "${habit.name}"`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete habit',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteHabit = async (id: string) => {
    try {
      const response = await fetch(`/api/habits?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete habit')

      setHabits(habits.filter((h) => h.id !== id))

      toast({
        title: 'Success',
        description: 'Habit deleted successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete habit',
        variant: 'destructive',
      })
    }
  }

  const isCompletedToday = (habit: Habit) => {
    if (!habit.last_done) return false
    return habit.last_done === formatDate(new Date())
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-32 bg-muted rounded animate-pulse mb-2" />
            <div className="h-5 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-48">
              <CardHeader>
                <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
          <p className="text-muted-foreground">
            Track your daily habits and build consistency.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Habit Name</Label>
                <Input
                  id="name"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g., Morning meditation"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateHabit()
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateHabit}>Create Habit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {habits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="p-4 rounded-full bg-primary/10 w-fit mb-6">
              <Target className="h-16 w-16 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No habits yet
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Start building better routines by creating your first habit. Track your progress and build consistency over time.
            </p>
            <Button onClick={() => setDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => {
            const completed = isCompletedToday(habit)
            return (
              <Card key={habit.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{habit.name}</span>
                    {habit.streak > 0 && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Flame className="h-5 w-5" />
                        <span className="font-bold">{habit.streak}</span>
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {habit.best_streak > 0 && (
                      <span className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        Best streak: {habit.best_streak} days
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Current Streak</span>
                      <span className="font-semibold">{habit.streak} days</span>
                    </div>
                    <Progress value={(habit.streak / 30) * 100} className="h-2" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant={completed ? 'outline' : 'default'}
                      onClick={() => handleCompleteHabit(habit)}
                      disabled={completed}
                    >
                      {completed ? 'Completed Today' : 'Mark Complete'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteHabit(habit.id)}
                    >
                      ×
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

