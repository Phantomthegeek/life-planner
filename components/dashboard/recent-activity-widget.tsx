'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, FileText, FolderOpen, BookOpen, Clock, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Activity {
  id: string
  type: 'task_completed' | 'note_created' | 'project_created' | 'cert_started'
  title: string
  description?: string
  timestamp: string
  url: string
  icon: typeof CheckCircle2
}

export function RecentActivityWidget() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        // Fetch recent tasks, notes, projects, and certifications
        const [tasksRes, notesRes, projectsRes, certsRes] = await Promise.all([
          fetch('/api/tasks?limit=5&order=created_at').catch(() => null),
          fetch('/api/notes?limit=5').catch(() => null),
          fetch('/api/projects?limit=5').catch(() => null),
          fetch('/api/certifications?limit=5').catch(() => null),
        ])

        const allActivities: Activity[] = []

        // Recent completed tasks
        if (tasksRes?.ok) {
          const tasks = await tasksRes.json()
          const completedTasks = Array.isArray(tasks) 
            ? tasks.filter((task: any) => task.done).slice(0, 3)
            : []
          completedTasks.forEach((task: any) => {
            try {
              allActivities.push({
                id: `task-${task.id}`,
                type: 'task_completed',
                title: task.title || 'Completed task',
                description: `Completed ${formatDistanceToNow(new Date(task.date || task.created_at), { addSuffix: true })}`,
                timestamp: task.date || task.created_at,
                url: '/dashboard/planner',
                icon: CheckCircle2,
              })
            } catch (e) {
              // Skip invalid dates
            }
          })
        }

        // Recent notes
        if (notesRes?.ok) {
          const notes = await notesRes.json()
          const recentNotes = Array.isArray(notes) ? notes.slice(0, 2) : []
          recentNotes.forEach((note: any) => {
            try {
              allActivities.push({
                id: `note-${note.id}`,
                type: 'note_created',
                title: (note.content || '').substring(0, 40) + ((note.content || '').length > 40 ? '...' : ''),
                description: `Created ${formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}`,
                timestamp: note.created_at,
                url: '/dashboard/notes',
                icon: FileText,
              })
            } catch (e) {
              // Skip invalid dates
            }
          })
        }

        // Recent projects
        if (projectsRes?.ok) {
          const projects = await projectsRes.json()
          const recentProjects = Array.isArray(projects) ? projects.slice(0, 2) : []
          recentProjects.forEach((project: any) => {
            try {
              allActivities.push({
                id: `project-${project.id}`,
                type: 'project_created',
                title: project.name || 'Project',
                description: `Created ${formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}`,
                timestamp: project.created_at,
                url: `/dashboard/projects/${project.id}`,
                icon: FolderOpen,
              })
            } catch (e) {
              // Skip invalid dates
            }
          })
        }

        // Recent certifications started
        if (certsRes?.ok) {
          const certs = await certsRes.json()
          const activeCerts = Array.isArray(certs)
            ? certs.filter((cert: any) => cert.progress && cert.progress.progress > 0).slice(0, 2)
            : []
          activeCerts.forEach((cert: any) => {
            try {
              allActivities.push({
                id: `cert-${cert.id}`,
                type: 'cert_started',
                title: cert.name || 'Course',
                description: `${cert.progress?.progress || 0}% complete`,
                timestamp: cert.progress?.updated_at || cert.created_at,
                url: `/dashboard/certifications/${cert.id}`,
                icon: BookOpen,
              })
            } catch (e) {
              // Skip invalid dates
            }
          })
        }

        // Sort by timestamp (most recent first)
        allActivities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )

        setActivities(allActivities.slice(0, 6))
      } catch (error) {
        console.error('Failed to load recent activity:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRecentActivity()
  }, [])

  if (loading) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No recent activity yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = activity.icon
              return (
                <Link
                  key={activity.id}
                  href={activity.url}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

