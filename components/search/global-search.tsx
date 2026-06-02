'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  Search,
  FileText,
  CheckSquare,
  FolderOpen,
  BookOpen,
  Calendar,
  Target,
  Brain,
  BarChart3,
  Settings,
  Plus,
  Loader2,
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'task' | 'note' | 'project' | 'certification'
  title: string
  description?: string
  url: string
}

// Pages the user can jump to. Lives next to the content results so Cmd+K
// is a single "go anywhere" surface instead of two duplicate dialogs.
const NAV_ITEMS: { id: string; label: string; href: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: Calendar },
  { id: 'planner', label: 'Planner', href: '/dashboard/planner', icon: Calendar },
  { id: 'timetable', label: 'Timetable', href: '/dashboard/planner/timetable', icon: Calendar },
  { id: 'habits', label: 'Habits', href: '/dashboard/habits', icon: Target },
  { id: 'courses', label: 'Courses', href: '/dashboard/certifications', icon: BookOpen },
  { id: 'notes', label: 'Notes', href: '/dashboard/notes', icon: FileText },
  { id: 'projects', label: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
  { id: 'coach', label: 'AI Coach', href: '/dashboard/coach', icon: Brain },
  { id: 'chat', label: 'Chat with Arcana', href: '/dashboard/chat', icon: Brain },
  { id: 'statistics', label: 'Statistics', href: '/dashboard/statistics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const QUICK_ACTIONS: { id: string; label: string; href: string; icon: any; shortcut?: string }[] = [
  { id: 'add-task', label: 'Add task', href: '/dashboard/planner', icon: Plus, shortcut: 'T' },
  { id: 'add-course', label: 'Add course', href: '/dashboard/certifications', icon: Plus, shortcut: 'C' },
]

// Strip JSON-looking strings from task.detail so they don't pollute matches.
// AI-generated tasks store JSON blobs there (e.g. `{"reminderMinutes":15}`).
function cleanTaskDetail(detail: any): string {
  if (typeof detail !== 'string') return ''
  const trimmed = detail.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return ''
  return trimmed
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Keep track of the latest in-flight request so a slow response from an
  // earlier query can't clobber the results of a newer one.
  const requestIdRef = useRef(0)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Reset the query when closing so reopening starts fresh.
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const myRequestId = ++requestIdRef.current
    const needle = trimmed.toLowerCase()
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const [tasksRes, notesRes, projectsRes, certsRes] = await Promise.all([
          fetch('/api/tasks').catch(() => null),
          fetch('/api/notes').catch(() => null),
          fetch('/api/projects').catch(() => null),
          fetch('/api/certifications').catch(() => null),
        ])

        // Bail if a newer query has been issued while we were waiting.
        if (myRequestId !== requestIdRef.current) return

        const all: SearchResult[] = []

        if (tasksRes?.ok) {
          const tasks = await tasksRes.json()
          if (Array.isArray(tasks)) {
            for (const task of tasks) {
              const title = (task.title || '').toLowerCase()
              const detail = cleanTaskDetail(task.detail).toLowerCase()
              if (title.includes(needle) || detail.includes(needle)) {
                all.push({
                  id: task.id,
                  type: 'task',
                  title: task.title || 'Untitled task',
                  description: task.date
                    ? task.done
                      ? `Done · ${task.date}`
                      : `Due ${task.date}`
                    : undefined,
                  url: '/dashboard/planner',
                })
                if (all.filter((r) => r.type === 'task').length >= 5) break
              }
            }
          }
        }

        if (notesRes?.ok) {
          const notes = await notesRes.json()
          if (Array.isArray(notes)) {
            for (const note of notes) {
              const content = (note.content || '').toLowerCase()
              if (content.includes(needle)) {
                const snippet = (note.content || '').slice(0, 60)
                all.push({
                  id: note.id,
                  type: 'note',
                  title: snippet + (note.content && note.content.length > 60 ? '…' : ''),
                  description: note.date ? `Note from ${note.date}` : 'Note',
                  url: '/dashboard/notes',
                })
                if (all.filter((r) => r.type === 'note').length >= 5) break
              }
            }
          }
        }

        if (projectsRes?.ok) {
          const projects = await projectsRes.json()
          if (Array.isArray(projects)) {
            for (const project of projects) {
              const name = (project.name || '').toLowerCase()
              const desc = (project.description || '').toLowerCase()
              if (name.includes(needle) || desc.includes(needle)) {
                all.push({
                  id: project.id,
                  type: 'project',
                  title: project.name,
                  description: project.description || (project.status ? `Status: ${project.status}` : 'Project'),
                  url: `/dashboard/projects/${project.id}`,
                })
                if (all.filter((r) => r.type === 'project').length >= 5) break
              }
            }
          }
        }

        if (certsRes?.ok) {
          const certs = await certsRes.json()
          if (Array.isArray(certs)) {
            for (const cert of certs) {
              const name = (cert.name || '').toLowerCase()
              const desc = (cert.description || '').toLowerCase()
              if (name.includes(needle) || desc.includes(needle)) {
                all.push({
                  id: cert.id,
                  type: 'certification',
                  title: cert.name,
                  description: cert.description || 'Course',
                  url: `/dashboard/certifications/${cert.id}`,
                })
                if (all.filter((r) => r.type === 'certification').length >= 5) break
              }
            }
          }
        }

        if (myRequestId === requestIdRef.current) {
          setResults(all)
          setLoading(false)
        }
      } catch (error) {
        if (myRequestId === requestIdRef.current) {
          console.error('Search error:', error)
          setLoading(false)
        }
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const go = (url: string) => {
    router.push(url)
    setOpen(false)
  }

  const iconFor = (type: SearchResult['type']) => {
    switch (type) {
      case 'task':
        return CheckSquare
      case 'note':
        return FileText
      case 'project':
        return FolderOpen
      case 'certification':
        return BookOpen
    }
  }

  const labelFor = (type: SearchResult['type']) => {
    switch (type) {
      case 'task':
        return 'Tasks'
      case 'note':
        return 'Notes'
      case 'project':
        return 'Projects'
      case 'certification':
        return 'Courses'
    }
  }

  // Group results by type so the user can scan them visually.
  const grouped: Record<SearchResult['type'], SearchResult[]> = {
    task: [],
    note: [],
    project: [],
    certification: [],
  }
  for (const r of results) grouped[r.type].push(r)

  const hasContentResults = results.length > 0
  const showContentEmpty = !loading && query.trim().length >= 2 && !hasContentResults

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open search"
      >
        <Search className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">Search or jump to…</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search tasks, notes, projects, courses — or type a page"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {/* When the query is empty, show quick actions + navigation only. */}
          {query.trim().length === 0 && (
            <>
              <CommandGroup heading="Quick actions">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon
                  return (
                    <CommandItem
                      key={action.id}
                      value={`action-${action.id} ${action.label}`}
                      onSelect={() => go(action.href)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{action.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Go to">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.id}
                      value={`nav-${item.id} ${item.label}`}
                      onSelect={() => go(item.href)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </>
          )}

          {/* With a query, show nav matches first then live content results. */}
          {query.trim().length > 0 && (
            <>
              <CommandGroup heading="Go to">
                {NAV_ITEMS.filter((n) =>
                  n.label.toLowerCase().includes(query.trim().toLowerCase())
                ).map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.id}
                      value={`nav-${item.id} ${item.label}`}
                      onSelect={() => go(item.href)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                      <CommandShortcut>page</CommandShortcut>
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {loading && (
                <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching…
                </div>
              )}

              {hasContentResults &&
                (['task', 'note', 'project', 'certification'] as const).map((type) => {
                  const items = grouped[type]
                  if (items.length === 0) return null
                  const Icon = iconFor(type)
                  return (
                    <CommandGroup key={type} heading={labelFor(type)}>
                      {items.map((result) => (
                        <CommandItem
                          key={`${result.type}-${result.id}`}
                          value={`${result.type}-${result.id} ${result.title}`}
                          onSelect={() => go(result.url)}
                        >
                          <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{result.title}</span>
                            {result.description && (
                              <span className="text-xs text-muted-foreground truncate">
                                {result.description}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                })}

              {showContentEmpty && (
                <CommandEmpty>No matches. Try a different word.</CommandEmpty>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
