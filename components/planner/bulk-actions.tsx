'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Task } from '@/lib/types'
import { Trash2, Check, X, Calendar, Tag } from 'lucide-react'

interface BulkActionsProps {
  tasks: Task[]
  selectedTasks: string[]
  onSelectionChange: (selected: string[]) => void
  onBulkAction: (action: string, taskIds: string[]) => Promise<void>
}

export function BulkActions({
  tasks,
  selectedTasks,
  onSelectionChange,
  onBulkAction,
}: BulkActionsProps) {
  const hasSelection = selectedTasks.length > 0
  const allSelected = tasks.length > 0 && selectedTasks.length === tasks.length

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(tasks.map((t) => t.id))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedTasks.length === 0) return

    await onBulkAction(action, selectedTasks)
    onSelectionChange([])
  }

  if (!hasSelection) {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={toggleAll}
          id="select-all"
        />
        <label
          htmlFor="select-all"
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Select all ({tasks.length})
        </label>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={toggleAll}
          id="select-all"
        />
        <label
          htmlFor="select-all"
          className="text-sm font-medium cursor-pointer"
        >
          {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('complete')}
        >
          <Check className="mr-2 h-4 w-4" />
          Mark Complete
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('incomplete')}
        >
          <X className="mr-2 h-4 w-4" />
          Mark Incomplete
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Tag className="mr-2 h-4 w-4" />
              Change Category
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Select Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {['work', 'study', 'personal', 'break', 'habit'].map((cat) => (
              <DropdownMenuItem
                key={cat}
                onClick={() => handleBulkAction(`category:${cat}`)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleBulkAction('delete')}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectionChange([])}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

