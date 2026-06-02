'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, X, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

interface TaskSubtasksProps {
  subtasks: Subtask[]
  onChange: (subtasks: Subtask[]) => void
}

export function TaskSubtasks({ subtasks, onChange }: TaskSubtasksProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return
    
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      completed: false,
    }
    
    onChange([...subtasks, newSubtask])
    setNewSubtaskTitle('')
  }

  const toggleSubtask = (id: string) => {
    onChange(
      subtasks.map((subtask) =>
        subtask.id === id
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      )
    )
  }

  const deleteSubtask = (id: string) => {
    onChange(subtasks.filter((subtask) => subtask.id !== id))
  }

  const updateSubtaskTitle = (id: string, title: string) => {
    onChange(
      subtasks.map((subtask) =>
        subtask.id === id ? { ...subtask, title } : subtask
      )
    )
  }

  const completedCount = subtasks.filter((s) => s.completed).length
  const totalCount = subtasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Checklist</Label>
        {totalCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount} completed
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Subtasks List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-2 group p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <button
              onClick={() => toggleSubtask(subtask.id)}
              className="flex-shrink-0"
            >
              {subtask.completed ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <Input
              value={subtask.title}
              onChange={(e) => updateSubtaskTitle(subtask.id, e.target.value)}
              className={cn(
                'flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto',
                subtask.completed && 'line-through text-muted-foreground'
              )}
              placeholder="Subtask title..."
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteSubtask(subtask.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Subtask */}
      <div className="flex gap-2">
        <Input
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addSubtask()
            }
          }}
          placeholder="Add a subtask..."
          className="text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addSubtask}
          disabled={!newSubtaskTitle.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}


