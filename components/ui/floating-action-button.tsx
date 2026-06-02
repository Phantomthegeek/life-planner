'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X, FileText, CheckSquare, Target } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  icon: typeof Plus
  action: () => void
  color?: string
}

// Routes where the FAB would just get in the way: the dashboard already has a
// "Quick Actions" card, and the planner/timetable views need every pixel.
const HIDE_ON_ROUTES = [
  '/dashboard',
  '/dashboard/planner',
  '/dashboard/planner/timetable',
  '/dashboard/planner/focus',
]

export function FloatingActionButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Hide on routes where it's redundant or in the way. Exact match so
  // sub-routes (e.g. /dashboard/planner/something/else) still get it.
  if (pathname && HIDE_ON_ROUTES.includes(pathname)) {
    return null
  }

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
    // Only show on mobile/tablet — desktop has the persistent sidebar nav, so
    // a floating button there is just visual noise. The `pb-[env(...)]`
    // pushes the FAB above the iOS home indicator in PWA mode.
    <div
      className="fixed right-4 z-40 md:hidden"
      style={{
        bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="relative">
        {open && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2">
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.label}
                  size="icon"
                  title={action.label}
                  aria-label={action.label}
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

        <Button
          size="icon"
          title={open ? 'Close' : 'Quick Actions'}
          aria-label={open ? 'Close quick actions' : 'Open quick actions'}
          aria-expanded={open}
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
