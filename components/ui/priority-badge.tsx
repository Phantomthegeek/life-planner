'use client'

import { cn } from '@/lib/utils'
import { AlertCircle, Circle, TrendingUp } from 'lucide-react'

export type Priority = 'high' | 'medium' | 'low' | 'urgent'

interface PriorityBadgeProps {
  priority: Priority
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const priorityConfig: Record<Priority, { 
  label: string
  color: string
  bgColor: string
  icon: typeof AlertCircle
}> = {
  urgent: {
    label: 'Urgent',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: AlertCircle,
  },
  high: {
    label: 'High',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: TrendingUp,
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: Circle,
  },
  low: {
    label: 'Low',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: Circle,
  },
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-2.5 py-1.5',
}

export function PriorityBadge({ 
  priority, 
  className,
  showIcon = true,
  size = 'sm'
}: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        config.color,
        config.bgColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  )
}

// Helper function to calculate priority from task data
export function calculateTaskPriority(task: {
  date?: string
  project_id?: string | null
  cert_id?: string | null
  done?: boolean
}): Priority {
  if (task.done) return 'low'
  
  // Calculate days until due date
  if (task.date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(task.date)
    dueDate.setHours(0, 0, 0, 0)
    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil < 0) return 'urgent' // Overdue
    if (daysUntil === 0) return 'urgent' // Due today
    if (daysUntil <= 1) return 'high' // Due tomorrow
    if (daysUntil <= 3) return 'medium' // Due in 3 days
  }
  
  // If task is part of a project or certification, it's at least medium
  if (task.project_id || task.cert_id) {
    return 'medium'
  }
  
  return 'low'
}

