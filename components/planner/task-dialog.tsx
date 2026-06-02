'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PriorityBadge, calculateTaskPriority, type Priority } from '@/components/ui/priority-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Bell,
  Zap,
  Battery,
  BatteryLow,
  Archive,
  ArchiveRestore,
  Copy,
} from 'lucide-react'
import { Task } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { RecurrencePattern, formatRecurrencePattern } from '@/lib/recurring-tasks'
import { Switch } from '@/components/ui/switch'
import { TaskSubtasks, Subtask } from './task-subtasks'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  selectedDate?: string
  onSave: (task: Partial<Task>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

const categories = [
  { value: 'work', label: 'Work', color: 'bg-blue-100 dark:bg-blue-900' },
  { value: 'study', label: 'Study', color: 'bg-green-100 dark:bg-green-900' },
  { value: 'personal', label: 'Personal', color: 'bg-purple-100 dark:bg-purple-900' },
  { value: 'break', label: 'Break', color: 'bg-yellow-100 dark:bg-yellow-900' },
  { value: 'habit', label: 'Habit', color: 'bg-pink-100 dark:bg-pink-900' },
]

export function TaskDialog({
  open,
  onOpenChange,
  task,
  selectedDate,
  onSave,
  onDelete,
}: TaskDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    detail: '',
    date: selectedDate || formatDate(new Date()),
    startTime: '09:00',
    duration: 60,
    category: 'work',
    priority: 'medium' as Priority,
    isRecurring: false,
    recurrenceType: 'daily' as 'daily' | 'weekly' | 'monthly',
    recurrenceInterval: 1,
    recurrenceEndDate: '',
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [archived, setArchived] = useState(false)
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null)
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low' | null>(null)

  useEffect(() => {
    if (task) {
      const startDate = task.start_ts ? new Date(task.start_ts) : new Date()
      const hours = startDate.getHours().toString().padStart(2, '0')
      const minutes = startDate.getMinutes().toString().padStart(2, '0')
      
      // Calculate priority from task data if not stored
      const calculatedPriority = calculateTaskPriority(task)
      
      // Parse subtasks, archived status, reminder, and energy level from detail field (stored as JSON)
      let parsedSubtasks: Subtask[] = []
      let detailText = task.detail || ''
      let isArchived = false
      let taskReminderMinutes: number | null = null
      let taskEnergyLevel: 'high' | 'medium' | 'low' | null = null
      try {
        if (task.detail && task.detail.startsWith('{')) {
          const detailObj = JSON.parse(task.detail)
          if (detailObj.subtasks && Array.isArray(detailObj.subtasks)) {
            parsedSubtasks = detailObj.subtasks
          }
          if (detailObj.text) {
            detailText = detailObj.text
          }
          if (detailObj.archived === true) {
            isArchived = true
          }
          if (typeof detailObj.reminderMinutes === 'number') {
            taskReminderMinutes = detailObj.reminderMinutes
          }
          if (['high', 'medium', 'low'].includes(detailObj.energyLevel)) {
            taskEnergyLevel = detailObj.energyLevel
          }
        }
      } catch {
        // If parsing fails, treat detail as plain text
        parsedSubtasks = []
      }
      
      setFormData({
        title: task.title || '',
        detail: detailText,
        date: task.date || formatDate(new Date()),
        startTime: `${hours}:${minutes}`,
        duration: task.duration_minutes || 60,
        category: task.category || 'work',
        priority: calculatedPriority,
        isRecurring: false,
        recurrenceType: 'daily',
        recurrenceInterval: 1,
        recurrenceEndDate: '',
      })
      setSubtasks(parsedSubtasks)
      setArchived(isArchived)
      setReminderMinutes(taskReminderMinutes)
      setEnergyLevel(taskEnergyLevel)
    } else {
      setFormData({
        title: '',
        detail: '',
        date: selectedDate || formatDate(new Date()),
        startTime: '09:00',
        duration: 60,
        category: 'work',
        priority: 'medium',
        isRecurring: false,
        recurrenceType: 'daily',
        recurrenceInterval: 1,
        recurrenceEndDate: '',
      })
      setSubtasks([])
      setArchived(false)
      setReminderMinutes(null)
      setEnergyLevel(null)
    }
  }, [task, selectedDate])

  const handleSubmit = async () => {
    if (!formData.title.trim()) return

    const [hours, minutes] = formData.startTime.split(':').map(Number)
    const startDate = new Date(formData.date)
    startDate.setHours(hours, minutes, 0, 0)
    const endDate = new Date(startDate.getTime() + formData.duration * 60 * 1000)

    // Build recurring pattern if enabled
    let recurring = null
    if (formData.isRecurring && !task) {
      recurring = {
        type: formData.recurrenceType,
        interval: formData.recurrenceInterval,
        endDate: formData.recurrenceEndDate || undefined,
      }
    }

    // Store subtasks, archived status, reminder, and energy level in detail field as JSON
    let detailValue = formData.detail
    const needsJson = subtasks.length > 0 || archived || reminderMinutes !== null || energyLevel !== null
    
    if (needsJson) {
      const detailObj: any = {}
      if (formData.detail && !formData.detail.startsWith('{')) {
        // If detail is plain text, preserve it
        detailObj.text = formData.detail
      } else if (formData.detail) {
        try {
          Object.assign(detailObj, JSON.parse(formData.detail))
        } catch {
          detailObj.text = formData.detail
        }
      }
      if (subtasks.length > 0) {
        detailObj.subtasks = subtasks
      } else {
        delete detailObj.subtasks
      }
      if (archived) {
        detailObj.archived = true
      } else {
        delete detailObj.archived
      }
      if (reminderMinutes !== null) {
        detailObj.reminderMinutes = reminderMinutes
      } else {
        delete detailObj.reminderMinutes
      }
      if (energyLevel !== null) {
        detailObj.energyLevel = energyLevel
      } else {
        delete detailObj.energyLevel
      }
      detailValue = JSON.stringify(detailObj)
    } else if (formData.detail && formData.detail.startsWith('{')) {
      // If no subtasks/archived but detail is JSON, clean it up
      try {
        const detailObj = JSON.parse(formData.detail)
        delete detailObj.subtasks
        delete detailObj.archived
        delete detailObj.reminderMinutes
        delete detailObj.energyLevel
        if (Object.keys(detailObj).length === 0) {
          detailValue = ''
        } else if (detailObj.text) {
          detailValue = detailObj.text
        } else {
          detailValue = JSON.stringify(detailObj)
        }
      } catch {
        // Keep as is if parsing fails
      }
    }

    await onSave({
      ...(task && { id: task.id }),
      title: formData.title,
      detail: detailValue || null,
      date: formData.date,
      start_ts: startDate.toISOString(),
      end_ts: endDate.toISOString(),
      duration_minutes: formData.duration,
      category: formData.category,
      recurring,
    })

    onOpenChange(false)
  }

  const handleDelete = async () => {
    if (!task || !onDelete) return
    await onDelete(task.id)
    setDeleteDialogOpen(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Task title"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="detail">Description</Label>
            <Textarea
              id="detail"
              value={formData.detail && !formData.detail.startsWith('{') ? formData.detail : 
                (formData.detail ? (() => {
                  try {
                    const parsed = JSON.parse(formData.detail)
                    return parsed.text || ''
                  } catch {
                    return formData.detail
                  }
                })() : '')}
              onChange={(e) =>
                setFormData({ ...formData, detail: e.target.value })
              }
              placeholder="Task description or notes (optional)"
              rows={3}
            />
            
                  {/* Subtasks/Checklist */}
                  <div className="mt-4 pt-4 border-t">
                    <TaskSubtasks
                      subtasks={subtasks}
                      onChange={setSubtasks}
                    />
                  </div>
                  
                  {/* Reminder Settings */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <Label htmlFor="reminder" className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Reminder
                    </Label>
                    <Select
                      value={reminderMinutes === null ? 'default' : reminderMinutes === 0 ? 'none' : reminderMinutes.toString()}
                      onValueChange={(value) => {
                        if (value === 'default') {
                          setReminderMinutes(null)
                        } else if (value === 'none') {
                          setReminderMinutes(0)
                        } else {
                          setReminderMinutes(parseInt(value))
                        }
                      }}
                    >
                      <SelectTrigger id="reminder">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Use default (15 min)</SelectItem>
                        <SelectItem value="5">5 minutes before</SelectItem>
                        <SelectItem value="10">10 minutes before</SelectItem>
                        <SelectItem value="15">15 minutes before</SelectItem>
                        <SelectItem value="30">30 minutes before</SelectItem>
                        <SelectItem value="60">1 hour before</SelectItem>
                        <SelectItem value="1440">1 day before</SelectItem>
                        <SelectItem value="0">No reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Energy Level */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <Label htmlFor="energy" className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Energy Level
                    </Label>
                    <Select
                      value={energyLevel || 'none'}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          setEnergyLevel(null)
                        } else {
                          setEnergyLevel(value as 'high' | 'medium' | 'low')
                        }
                      }}
                    >
                      <SelectTrigger id="energy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Battery className="h-4 w-4 text-green-500" />
                            High Energy
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <Battery className="h-4 w-4 text-yellow-500" />
                            Medium Energy
                          </div>
                        </SelectItem>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <BatteryLow className="h-4 w-4 text-red-500" />
                            Low Energy
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Helps you plan tasks based on your energy levels throughout the day
                    </p>
                  </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Start Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                step="5"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration: parseInt(e.target.value) || 60,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value as Priority })
              }
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={formData.priority} size="sm" />
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority="urgent" size="sm" />
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority="high" size="sm" />
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority="medium" size="sm" />
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority="low" size="sm" />
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Task Options */}
          {!task && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="recurring">Make this a recurring task</Label>
                <Switch
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRecurring: checked })
                  }
                />
              </div>

              {formData.isRecurring && (
                <div className="space-y-3 pl-6 border-l-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurrence-type">Repeat</Label>
                      <Select
                        value={formData.recurrenceType}
                        onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                          setFormData({ ...formData, recurrenceType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recurrence-interval">Every</Label>
                      <Input
                        id="recurrence-interval"
                        type="number"
                        min="1"
                        value={formData.recurrenceInterval}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrenceInterval: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurrence-end">End Date (optional)</Label>
                    <Input
                      id="recurrence-end"
                      type="date"
                      value={formData.recurrenceEndDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrenceEndDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          {task && (
            <div className="flex items-center gap-2 mr-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const newArchived = !archived
                  setArchived(newArchived)
                  // Save immediately
                  await handleSubmit()
                }}
              >
                {archived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Unarchive
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </>
                )}
              </Button>
              {onDelete && (
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                      size="sm"
                    >
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Task</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{task.title}&quot;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Duplicate task by appending "(Copy)" to title; saving without an existing
                  // task id (handled by caller) will create a new record.
                  setFormData({
                    ...formData,
                    title: `${formData.title} (Copy)`,
                  })
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
            </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
            {task ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

