import { useState, useCallback, useRef } from 'react'

export interface UndoAction {
  id: string
  type: 'delete' | 'update' | 'create'
  entityType: 'project' | 'note' | 'certification' | 'template' | 'habit' | 'module'
  data: any // The deleted/updated data
  undoFn: () => Promise<void> | void
  timestamp: number
}

const UNDO_TIMEOUT = 8000 // 8 seconds

export function useUndo() {
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearUndo = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setUndoAction(null)
  }, [])

  const setUndo = useCallback((action: Omit<UndoAction, 'timestamp'>) => {
    // Clear any existing undo action
    clearUndo()

    const newAction: UndoAction = {
      ...action,
      timestamp: Date.now(),
    }

    setUndoAction(newAction)

    // Auto-clear after timeout
    timeoutRef.current = setTimeout(() => {
      setUndoAction(null)
    }, UNDO_TIMEOUT)
  }, [clearUndo])

  const performUndo = useCallback(async () => {
    if (!undoAction) return

    try {
      await undoAction.undoFn()
      clearUndo()
      return true
    } catch (error) {
      console.error('Undo failed:', error)
      clearUndo()
      return false
    }
  }, [undoAction, clearUndo])

  return {
    undoAction,
    setUndo,
    performUndo,
    clearUndo,
  }
}

