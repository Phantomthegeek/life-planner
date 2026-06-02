'use client'

import { Task } from '@/lib/types'
import { PriorityBadge, calculateTaskPriority } from '@/components/ui/priority-badge'
import { Clock, Calendar, Tag, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface TaskTooltipProps {
  task: Task
  children: React.ReactNode
}

export function TaskTooltip({ task, children }: TaskTooltipProps) {
  const priority = calculateTaskPriority(task)
  
  return (
    <div className="group relative">
      {children}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-64">
        <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl p-4 text-sm border border-gray-700">
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
          </div>
          
          {/* Task Title */}
          <div className="font-semibold mb-2 flex items-center gap-2">
            <span>{task.title}</span>
            <PriorityBadge priority={priority} size="sm" />
          </div>
          
          {/* Task Details */}
          {task.detail && (
            <div className="mb-2 text-gray-300 flex items-start gap-2">
              <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{task.detail}</span>
            </div>
          )}
          
          {/* Task Info Grid */}
          <div className="space-y-1.5 text-xs">
            {task.date && (
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(task.date), 'MMM d, yyyy')}</span>
              </div>
            )}
            
            {task.start_ts && (
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="h-3 w-3" />
                <span>
                  {format(new Date(task.start_ts), 'h:mm a')}
                  {task.duration_minutes && ` • ${task.duration_minutes} min`}
                </span>
              </div>
            )}
            
            {task.category && (
              <div className="flex items-center gap-2 text-gray-300">
                <Tag className="h-3 w-3" />
                <span className="capitalize">{task.category}</span>
              </div>
            )}
            
            {task.done && (
              <div className="pt-1 border-t border-gray-700">
                <span className="text-green-400">✓ Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


