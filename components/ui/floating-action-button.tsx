'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X, FileText, CheckSquare, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  icon: typeof Plus
  action: () => void
  color?: string
}

export function FloatingActionButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const actions: QuickAction[] = [
    {
      label: 'New Task',
      icon: CheckSquare,
      action: () => {
        router.push('/dashboard/planner')
        setOpen(false)
      },
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      label: 'New Note',
      icon: FileText,
      action: () => {
        router.push('/dashboard/notes')
        setOpen(false)
      },
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      label: 'Check Habit',
      icon: Target,
      action: () => {
        router.push('/dashboard/habits')
        setOpen(false)
      },
      color: 'bg-green-500 hover:bg-green-600',
    },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        {/* Action buttons */}
        {open && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2">
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.label}
                  size="icon"
                  title={action.label}
                  className={cn(
                    'h-12 w-12 rounded-full shadow-lg transition-all',
                    action.color || 'bg-primary hover:bg-primary/90',
                    'animate-in fade-in slide-in-from-bottom-2'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={action.action}
                >
                  <Icon className="h-5 w-5 text-white" />
                </Button>
              )
            })}
          </div>
        )}

        {/* Main FAB */}
        <Button
          size="icon"
          title={open ? 'Close' : 'Quick Actions'}
          className={cn(
            'h-14 w-14 rounded-full shadow-lg transition-all',
            open
              ? 'bg-destructive hover:bg-destructive/90 rotate-45'
              : 'bg-primary hover:bg-primary/90'
          )}
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>
    </div>
  )
}

