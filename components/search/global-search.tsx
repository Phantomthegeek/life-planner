'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Search, FileText, CheckSquare, FolderOpen, BookOpen } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'task' | 'note' | 'project' | 'certification'
  title: string
  description?: string
  url: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const searchAll = async () => {
      setLoading(true)
      try {
        const [tasksRes, notesRes, projectsRes, certsRes] = await Promise.all([
          fetch('/api/tasks').catch(() => null),
          fetch('/api/notes').catch(() => null),
          fetch('/api/projects').catch(() => null),
          fetch('/api/certifications').catch(() => null),
        ])

        const allResults: SearchResult[] = []

        // Search tasks
        if (tasksRes?.ok) {
          const tasks = await tasksRes.json()
          const matchingTasks = tasks
            .filter((task: any) =>
              task.title?.toLowerCase().includes(query.toLowerCase()) ||
              task.detail?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5)
            .map((task: any) => ({
              id: task.id,
              type: 'task' as const,
              title: task.title,
              description: task.detail || `Due: ${task.date}`,
              url: `/dashboard/planner?task=${task.id}`,
            }))
          allResults.push(...matchingTasks)
        }

        // Search notes
        if (notesRes?.ok) {
          const notes = await notesRes.json()
          const matchingNotes = notes
            .filter((note: any) =>
              note.content?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5)
            .map((note: any) => ({
              id: note.id,
              type: 'note' as const,
              title: note.content.substring(0, 50) + (note.content.length > 50 ? '...' : ''),
              description: `Note from ${note.date}`,
              url: '/dashboard/notes',
            }))
          allResults.push(...matchingNotes)
        }

        // Search projects
        if (projectsRes?.ok) {
          const projects = await projectsRes.json()
          const matchingProjects = projects
            .filter((project: any) =>
              project.name?.toLowerCase().includes(query.toLowerCase()) ||
              project.description?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5)
            .map((project: any) => ({
              id: project.id,
              type: 'project' as const,
              title: project.name,
              description: project.description || `Status: ${project.status}`,
              url: `/dashboard/projects/${project.id}`,
            }))
          allResults.push(...matchingProjects)
        }

        // Search certifications
        if (certsRes?.ok) {
          const certs = await certsRes.json()
          const matchingCerts = certs
            .filter((cert: any) =>
              cert.name?.toLowerCase().includes(query.toLowerCase()) ||
              cert.description?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5)
            .map((cert: any) => ({
              id: cert.id,
              type: 'certification' as const,
              title: cert.name,
              description: cert.description || 'Course',
              url: `/dashboard/certifications/${cert.id}`,
            }))
          allResults.push(...matchingCerts)
        }

        setResults(allResults.slice(0, 10))
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchAll, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    router.push(result.url)
    setOpen(false)
    setQuery('')
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'task':
        return CheckSquare
      case 'note':
        return FileText
      case 'project':
        return FolderOpen
      case 'certification':
        return BookOpen
      default:
        return Search
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open search"
      >
        <Search className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">Search tasks, notes, projects…</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search tasks, notes, projects, courses..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {!loading && query.length < 2 && (
            <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
          )}
          {results.length > 0 && (
            <>
              <CommandGroup heading="Results">
                {results.map((result) => {
                  const Icon = getIcon(result.type)
                  return (
                    <CommandItem
                      key={`${result.type}-${result.id}`}
                      onSelect={() => handleSelect(result)}
                      className="cursor-pointer"
                    >
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">{result.title}</span>
                        {result.description && (
                          <span className="text-xs text-muted-foreground">
                            {result.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}

