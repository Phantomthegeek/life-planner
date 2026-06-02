'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useUndo } from '@/hooks/use-undo'
import { ToastAction } from '@/components/ui/toast'
import { Plus, FolderOpen, Target, Calendar, CheckCircle2, Loader2, Edit, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { Project } from '@/lib/types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const { toast } = useToast()
  const { setUndo, performUndo } = useUndo()

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      setProjects(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load projects',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Project name is required',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          target_date: targetDate || null,
          status: 'active',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      toast({
        title: 'Success!',
        description: 'Project created successfully',
      })

      setName('')
      setDescription('')
      setTargetDate('')
      setDialogOpen(false)
      fetchProjects()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteClick = (id: string) => {
    setProjectToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!projectToDelete) return

    // Store the project data before deletion for undo
    const projectToRestore = projects.find(p => p.id === projectToDelete)
    if (!projectToRestore) return

    try {
      const response = await fetch(`/api/projects/${projectToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      // Set up undo action
      setUndo({
        id: projectToDelete,
        type: 'delete',
        entityType: 'project',
        data: projectToRestore,
        undoFn: async () => {
          // Restore the project
          const restoreResponse = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: projectToRestore.name,
              description: projectToRestore.description,
              target_date: projectToRestore.target_date,
              status: projectToRestore.status,
            }),
          })
          if (!restoreResponse.ok) throw new Error('Failed to restore project')
          fetchProjects()
        },
      })

      toast({
        title: 'Project deleted',
        description: 'Project deleted successfully',
        action: (
          <ToastAction altText="Undo" onClick={performUndo}>
            Undo
          </ToastAction>
        ),
      })

      setDeleteDialogOpen(false)
      setProjectToDelete(null)
      fetchProjects()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete project',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-6 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-64">
              <CardHeader>
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Group related tasks. Track how each one is moving.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Organize your tasks into projects
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Website Redesign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this project about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-date">Target Date (Optional)</Label>
                <Input
                  id="target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 px-6 text-center">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-6">
              <FolderOpen className="h-16 w-16 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No projects yet
            </h3>
            <p className="text-muted-foreground text-center max-w-md mx-auto mb-6">
              Organize your work into projects to track progress, manage tasks, and achieve your goals more effectively.
            </p>
            <Button onClick={() => setDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="h-full flex flex-col transition-colors hover:border-foreground/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{project.name}</CardTitle>
                      {project.description && (
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      project.status === 'paused' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} />
                    </div>
                    {project.target_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {format(new Date(project.target_date), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center text-primary font-medium">
                    <span>View Details</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

