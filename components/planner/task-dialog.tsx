'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Task } from '@/lib/types'
import { formatDate, formatDateTime } from '@/lib/utils'
import { RecurrencePattern, formatRecurrencePattern } from '@/lib/recurring-tasks'
import { Switch } from '@/components/ui/switch'

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
    isRecurring: false,
    recurrenceType: 'daily' as 'daily' | 'weekly' | 'monthly',
    recurrenceInterval: 1,
    recurrenceEndDate: '',
  })

  useEffect(() => {
    if (task) {
      const startDate = task.start_ts ? new Date(task.start_ts) : new Date()
      const hours = startDate.getHours().toString().padStart(2, '0')
      const minutes = startDate.getMinutes().toString().padStart(2, '0')
      
      setFormData({
        title: task.title || '',
        detail: task.detail || '',
        date: task.date || formatDate(new Date()),
        startTime: `${hours}:${minutes}`,
        duration: task.duration_minutes || 60,
        category: task.category || 'work',
      })
    } else {
      setFormData({
        title: '',
        detail: '',
        date: selectedDate || formatDate(new Date()),
        startTime: '09:00',
        duration: 60,
        category: 'work',
      })
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

    await onSave({
      ...(task && { id: task.id }),
      title: formData.title,
      detail: formData.detail || null,
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
    if (confirm('Are you sure you want to delete this task?')) {
      await onDelete(task.id)
      onOpenChange(false)
    }
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
              value={formData.detail}
              onChange={(e) =>
                setFormData({ ...formData, detail: e.target.value })
              }
              placeholder="Task description (optional)"
              rows={3}
            />
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
          {task && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              Delete
            </Button>
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

