'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Task } from '@/lib/types'
import { analyzeTaskForRescheduling, findOptimalRescheduleTime, RescheduleSuggestion } from '@/lib/smart-reschedule'
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface RescheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  existingTasks: Task[]
  onReschedule: (taskId: string, newDate: string, newStart: string) => Promise<void>
  onDismiss?: (taskId: string) => Promise<void>
}

export function RescheduleDialog({
  open,
  onOpenChange,
  task,
  existingTasks,
  onReschedule,
  onDismiss,
}: RescheduleDialogProps) {
  const [suggestion, setSuggestion] = useState<RescheduleSuggestion | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (task && open) {
      // Analyze task for rescheduling
      const analysis = analyzeTaskForRescheduling(task)
      
      if (analysis) {
        // Get optimal time considering existing schedule
        const optimal = findOptimalRescheduleTime(task, existingTasks)
        setSuggestion(optimal)
      } else {
        setSuggestion(null)
      }
    }
  }, [task, open, existingTasks])

  if (!task || !suggestion) {
    return null
  }

  const handleReschedule = async () => {
    if (!suggestion) return
    
    setLoading(true)
    try {
      await onReschedule(task.id, suggestion.suggestedDate, suggestion.suggestedStart)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to reschedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    if (onDismiss) {
      await onDismiss(task.id)
    }
    onOpenChange(false)
  }

  const confidenceColor = suggestion.confidence >= 0.8 
    ? 'text-green-600 dark:text-green-400'
    : suggestion.confidence >= 0.6
    ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-orange-600 dark:text-orange-400'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Reschedule Task?
          </DialogTitle>
          <DialogDescription>
            This task appears to need rescheduling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="font-medium mb-2">{task.title}</div>
            {task.start_ts && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Originally scheduled: {new Date(task.start_ts).toLocaleString()}
              </div>
            )}
          </div>

          {suggestion && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium mb-1">Suggested Reschedule</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(suggestion.suggestedDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {new Date(suggestion.suggestedStart).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <div className="font-medium mb-1">Reason:</div>
                <p>{suggestion.reason}</p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confidence:</span>
                <span className={`font-medium ${confidenceColor}`}>
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {onDismiss && (
            <Button variant="outline" onClick={handleDismiss}>
              Dismiss
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReschedule} disabled={loading || !suggestion}>
            {loading ? 'Rescheduling...' : 'Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

