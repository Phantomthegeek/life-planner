'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckSquare, Square, MoreVertical, Trash2, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BulkActionsProps {
  selectedTasks: string[]
  onClearSelection: () => void
  onBulkAction: (action: string, updates?: any) => Promise<void>
}

export function BulkActions({
  selectedTasks,
  onClearSelection,
  onBulkAction,
}: BulkActionsProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleBulkAction = async (action: string, updates?: any) => {
    if (selectedTasks.length === 0) return

    setLoading(true)
    try {
      await onBulkAction(action, updates)
      toast({
        title: 'Success',
        description: `Bulk action completed for ${selectedTasks.length} task(s)`,
      })
      onClearSelection()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to perform bulk action',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (selectedTasks.length === 0) return null

  return (
    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border">
      <span className="text-sm font-medium">
        {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
      </span>
      <div className="flex gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('complete')}
          disabled={loading}
        >
          <Check className="mr-2 h-4 w-4" />
          Complete
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('uncomplete')}
          disabled={loading}
        >
          <X className="mr-2 h-4 w-4" />
          Uncomplete
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleBulkAction('delete')}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
      >
        Clear
      </Button>
    </div>
  )
}

// Task selection checkbox component
interface TaskCheckboxProps {
  taskId: string
  selected: boolean
  onToggle: (taskId: string) => void
}

export function TaskCheckbox({ taskId, selected, onToggle }: TaskCheckboxProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle(taskId)
      }}
      className="mr-2"
    >
      {selected ? (
        <CheckSquare className="h-4 w-4 text-primary" />
      ) : (
        <Square className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  )
}

