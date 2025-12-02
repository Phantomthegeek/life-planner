'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import {
  Calendar,
  BookOpen,
  Target,
  FileText,
  Brain,
  BarChart3,
  Settings,
  Plus,
  Search,
  Clock,
} from 'lucide-react'
import { useTemplateStore } from '@/stores/use-template-store'
import { formatDate } from '@/lib/utils'

interface CommandPaletteProps {
  onQuickAdd?: () => void
  onTemplateSelect?: (template: any) => void
}

export function CommandPalette({ onQuickAdd, onTemplateSelect }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const templates = useTemplateStore((state) => state.templates)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  const quickCommands = [
    {
      id: 'quick-add',
      label: 'Quick Add Task',
      icon: Plus,
      action: () => {
        if (onQuickAdd) {
          onQuickAdd()
        } else {
          router.push('/dashboard/planner')
        }
      },
      shortcut: '⌘T',
    },
    {
      id: 'focus-timer',
      label: 'Start Focus Timer',
      icon: Clock,
      action: () => router.push('/dashboard/planner?focus=true'),
      shortcut: '⌘F',
    },
  ]

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Calendar, href: '/dashboard' },
    { id: 'planner', label: 'Planner', icon: Calendar, href: '/dashboard/planner' },
    { id: 'certifications', label: 'Courses', icon: BookOpen, href: '/dashboard/certifications' },
    { id: 'habits', label: 'Habits', icon: Target, href: '/dashboard/habits' },
    { id: 'notes', label: 'Notes', icon: FileText, href: '/dashboard/notes' },
    { id: 'coach', label: 'AI Coach', icon: Brain, href: '/dashboard/coach' },
    { id: 'statistics', label: 'Statistics', icon: BarChart3, href: '/dashboard/statistics' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ]

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Quick Actions">
            {quickCommands.map((command) => {
              const Icon = command.icon
              return (
                <CommandItem
                  key={command.id}
                  onSelect={() => runCommand(command.action)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <CommandShortcut>{command.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>

          {templates.length > 0 && (
            <CommandGroup heading="Task Templates">
              {templates.map((template) => (
                <CommandItem
                  key={template.id}
                  onSelect={() => {
                    if (onTemplateSelect) {
                      onTemplateSelect(template)
                    }
                    setOpen(false)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>{template.name}</span>
                  <CommandShortcut>{template.category}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Navigation">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.id}
                  onSelect={() => runCommand(() => router.push(item.href))}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

