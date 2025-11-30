'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Calendar, CheckCircle2, Clock, Target, TrendingUp, Loader2, Brain, Sparkles } from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface TaskStats {
  total: number
  completed: number
  byCategory: Record<string, number>
  byDay: Array<{ date: string; completed: number; total: number }>
}

interface HabitStats {
  total: number
  activeStreaks: number
  totalStreakDays: number
  byHabit: Array<{ name: string; streak: number }>
}

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true)
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    byCategory: {},
    byDay: [],
  })
  const [habitStats, setHabitStats] = useState<HabitStats>({
    total: 0,
    activeStreaks: 0,
    totalStreakDays: 0,
    byHabit: [],
  })
  const [dateRange, setDateRange] = useState(30) // days

  useEffect(() => {
    fetchStatistics()
  }, [dateRange])

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      const endDate = format(new Date(), 'yyyy-MM-dd')
      const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd')

      // Fetch tasks
      const tasksResponse = await fetch(
        `/api/tasks?startDate=${startDate}&endDate=${endDate}`
      )
      const tasks = await tasksResponse.json()

      // Fetch habits
      const habitsResponse = await fetch('/api/habits')
      const habits = await habitsResponse.json()

      // Calculate task stats
      const completed = tasks.filter((t: any) => t.done).length
      const byCategory: Record<string, number> = {}
      tasks.forEach((task: any) => {
        const cat = task.category || 'other'
        byCategory[cat] = (byCategory[cat] || 0) + 1
      })

      // Calculate daily stats
      const days = eachDayOfInterval({
        start: subDays(new Date(), dateRange),
        end: new Date(),
      })

      const byDay = days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const dayTasks = tasks.filter((t: any) => t.date === dayStr)
        return {
          date: format(day, 'MMM d'),
          completed: dayTasks.filter((t: any) => t.done).length,
          total: dayTasks.length,
        }
      })

      setTaskStats({
        total: tasks.length,
        completed,
        byCategory,
        byDay,
      })

      // Calculate habit stats
      const activeStreaks = habits.filter((h: any) => h.streak > 0).length
      const totalStreakDays = habits.reduce(
        (sum: number, h: any) => sum + (h.streak || 0),
        0
      )

      setHabitStats({
        total: habits.length,
        activeStreaks,
        totalStreakDays,
        byHabit: habits.map((h: any) => ({
          name: h.name,
          streak: h.streak || 0,
        })),
      })
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']

  const categoryData = Object.entries(taskStats.byCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const completionRate = taskStats.total > 0 
    ? Math.round((taskStats.completed / taskStats.total) * 100) 
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
          <p className="text-muted-foreground">
            Insights into your productivity and progress.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/coach/weekly-review">
              <Sparkles className="mr-2 h-4 w-4" />
              Weekly Review
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.completed}</div>
            <p className="text-xs text-muted-foreground">
              out of {taskStats.total} tasks ({completionRate}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{habitStats.activeStreaks}</div>
            <p className="text-xs text-muted-foreground">
              {habitStats.totalStreakDays} total streak days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Task completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Period</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dateRange}d</div>
            <p className="text-xs text-muted-foreground">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Over Time</CardTitle>
              <CardDescription>
                Daily task completion for the last {dateRange} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={taskStats.byDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#8884d8"
                    name="Completed"
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#82ca9d"
                    name="Total"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks by Category</CardTitle>
              <CardDescription>Distribution of tasks across categories</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No task data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Habit Streaks</CardTitle>
              <CardDescription>
                Current streak for each habit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {habitStats.byHabit.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={habitStats.byHabit}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="streak" fill="#8884d8" name="Streak" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No habit data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

