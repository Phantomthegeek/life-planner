'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TaskRiskBadgeProps {
  taskId: string
  className?: string
}

export function TaskRiskBadge({ taskId, className }: TaskRiskBadgeProps) {
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskId) return

    fetch(`/api/predictions/task-completion?task_id=${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        setPrediction(data)
      })
      .catch((error) => {
        console.error('Error fetching prediction:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [taskId])

  if (loading || !prediction) return null

  const { risk_level, completion_likelihood } = prediction

  if (risk_level === 'low') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400',
          className
        )}
      >
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {Math.round(completion_likelihood * 100)}% likely
      </Badge>
    )
  }

  if (risk_level === 'high') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400',
          className
        )}
      >
        <AlertTriangle className="mr-1 h-3 w-3" />
        {Math.round(completion_likelihood * 100)}% likely
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
        className
      )}
    >
      <Clock className="mr-1 h-3 w-3" />
      {Math.round(completion_likelihood * 100)}% likely
    </Badge>
  )
}

