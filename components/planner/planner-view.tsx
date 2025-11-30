'use client'

import { useState, useMemo, useEffect } from 'react'
import { format, addDays, parseISO, startOfWeek } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Task } from '@/lib/types'
import { ChevronLeft, ChevronRight, Plus, Clock, RefreshCw } from 'lucide-react'
import { TaskDialog } from './task-dialog'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { useTaskStore } from '@/stores/use-task-store'

interface PlannerViewProps {
  initialTasks: Task[]
}

const hours = Array.from({ length: 24 }, (_, i) => i)

export function PlannerView({ initialTasks }: PlannerViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(formatDate(currentDate))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const { toast } = useToast()
  const { tasks, setTasks, addTask, updateTask, deleteTask } = useTaskStore()

  // Initialize tasks from props and refresh periodically
  useEffect(() => {
    if (initialTasks.length > 0) {
      setTasks(initialTasks)
    }
  }, [initialTasks, setTasks])

  // Function to refresh tasks
  const refreshTasks = async () => {
    try {
      const weekStart = new Date(currentDate)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 13) // 2 weeks ahead to catch study plans

      const response = await fetch(
        `/api/tasks?startDate=${formatDate(weekStart)}&endDate=${formatDate(weekEnd)}`
      )
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
        toast({
          title: 'Tasks Refreshed',
          description: 'Your calendar has been updated.',
        })
      }
    } catch (error) {
      console.error('Failed to refresh tasks:', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh tasks',
        variant: 'destructive',
      })
    }
  }

  // Refresh tasks when the component becomes visible (handles back navigation)
  useEffect(() => {
    const handleFocus = () => {
      refreshTasks()
    }

    // Refresh on window focus (when user navigates back)
    window.addEventListener('focus', handleFocus)
    // Also refresh on mount to catch any new tasks
    handleFocus()

    return () => window.removeEventListener('focus', handleFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, setTasks])

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [currentDate])

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    tasks.forEach((task) => {
      if (!grouped[task.date]) {
        grouped[task.date] = []
      }
      grouped[task.date].push(task)
    })
    return grouped
  }, [tasks])

  const getTasksForSlot = (date: Date, hour: number) => {
    const dateStr = formatDate(date)
    const dateTasks = tasksByDate[dateStr] || []
    return dateTasks.filter((task) => {
      if (!task.start_ts) return false
      const taskHour = new Date(task.start_ts).getHours()
      return taskHour === hour
    })
  }

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      const isUpdate = !!taskData.id
      const url = isUpdate ? '/api/tasks' : '/api/tasks'
      const method = isUpdate ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) throw new Error(`Failed to ${isUpdate ? 'update' : 'create'} task`)

      const task = await response.json()
      
      if (isUpdate) {
        updateTask(task.id, task)
      } else {
        addTask(task)
      }

      toast({
        title: 'Success',
        description: `Task ${isUpdate ? 'updated' : 'created'} successfully`,
      })

      setEditingTask(null)
      return task
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save task',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete task')

      deleteTask(id)
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete task',
        variant: 'destructive',
      })
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setDialogOpen(true)
  }


  return (
    <div className="space-y-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addDays(currentDate, -7))}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base md:text-xl font-semibold whitespace-nowrap">
                {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addDays(currentDate, 7))}
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="h-9 text-xs md:text-sm"
              >
                Today
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshTasks}
                title="Refresh tasks"
                className="h-9 text-xs md:text-sm"
              >
                <RefreshCw className="h-4 w-4 md:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Button
                onClick={() => {
                  setEditingTask(null)
                  setDialogOpen(true)
                }}
                size="sm"
                className="h-9 text-xs md:text-sm"
              >
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden sm:inline">Add Task</span>
              </Button>
            </div>
          </div>

      {/* Weekly Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Day Headers */}
              <div className="grid grid-cols-8 border-b">
                <div className="p-4 font-medium">Time</div>
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`p-4 text-center border-l ${
                      formatDate(day) === formatDate(new Date())
                        ? 'bg-primary/10 font-bold'
                        : ''
                    }`}
                  >
                    <div className="text-sm text-muted-foreground">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-lg">{format(day, 'd')}</div>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              <div className="divide-y">
                {hours.map((hour) => (
                  <div key={hour} className="grid grid-cols-8">
                    <div className="p-2 text-sm text-muted-foreground border-r">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    {weekDays.map((day) => {
                      const dayTasks = getTasksForSlot(day, hour)
                      return (
                        <div
                          key={`${day.toISOString()}-${hour}`}
                          className="p-1 border-l min-h-[60px]"
                        >
                          {dayTasks.map((task) => (
                            <div
                              key={task.id}
                              className={`p-2 rounded text-xs cursor-pointer mb-1 hover:ring-2 hover:ring-primary transition-all ${
                                task.done
                                  ? 'bg-muted opacity-50 line-through'
                                  : task.category === 'work'
                                  ? 'bg-blue-100 dark:bg-blue-900'
                                  : task.category === 'study'
                                  ? 'bg-green-100 dark:bg-green-900'
                                  : task.category === 'break'
                                  ? 'bg-yellow-100 dark:bg-yellow-900'
                                  : task.category === 'personal'
                                  ? 'bg-purple-100 dark:bg-purple-900'
                                  : 'bg-pink-100 dark:bg-pink-900'
                              }`}
                              onClick={() => handleEditTask(task)}
                              title={task.title}
                            >
                              <div className="font-medium truncate">
                                {task.title}
                              </div>
                              {task.start_ts && (
                                <div className="text-xs opacity-75">
                                  <Clock className="inline h-3 w-3 mr-1" />
                                  {new Date(task.start_ts).toLocaleTimeString(
                                    [],
                                    { hour: '2-digit', minute: '2-digit' }
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        selectedDate={selectedDate}
        onSave={handleSaveTask}
        onDelete={editingTask ? handleDeleteTask : undefined}
      />
    </div>
  )
}

