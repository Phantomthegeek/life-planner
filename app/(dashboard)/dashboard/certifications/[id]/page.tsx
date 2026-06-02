'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EnhancedProgress, CircularProgress } from '@/components/progress/enhanced-progress'
import { BookOpen, Calendar, CheckCircle2, Circle, Loader2, ArrowLeft, Plus, Brain, Edit, Trash2, Clock, GraduationCap, Zap } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Module {
  id: string
  cert_id: string
  title: string
  description: string | null
  estimated_hours: number
  order_idx: number
}

interface Certification {
  id: string
  slug: string
  name: string
  description: string | null
  difficulty: number
}

interface CertProgress {
  id: string
  user_id: string
  cert_id: string
  progress: number
  target_date: string | null
  exam_scheduled: boolean
  exam_date: string | null
}

export default function CertificationDetailPage() {
  const params = useParams()
  const certId = params.id as string
  const [loading, setLoading] = useState(true)
  const [certification, setCertification] = useState<Certification | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [progress, setProgress] = useState<CertProgress | null>(null)
  const [addModuleDialogOpen, setAddModuleDialogOpen] = useState(false)
  const [editModuleDialogOpen, setEditModuleDialogOpen] = useState(false)
  const [targetDateDialogOpen, setTargetDateDialogOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleDescription, setModuleDescription] = useState('')
  const [moduleHours, setModuleHours] = useState(5)
  const [targetDate, setTargetDate] = useState('')
  const [examDate, setExamDate] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null)
  const [totalLessons, setTotalLessons] = useState(0)
  const [completedLessons, setCompletedLessons] = useState(0)
  const [completedModules, setCompletedModules] = useState(0)
  const [modulesWithLessons, setModulesWithLessons] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchCertificationDetails()
    refreshLessonProgress()
    const onFocus = () => refreshLessonProgress()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certId])

  // Pull lessons + group by module so we can show module-level completion
  // stats. Module is "complete" when every lesson under it is checked off.
  //
  // Completion data is fetched from the server (cert_progress_detailed) so
  // ticks are consistent across devices. We fall back to the localStorage
  // cache that the learn page maintains if the server is unreachable.
  const refreshLessonProgress = async () => {
    try {
      const res = await fetch(`/api/certifications/${certId}/lessons`)
      if (!res.ok) return
      const lessonsData: Array<{ id: string; module_id: string }> = await res.json()
      setTotalLessons(lessonsData.length)

      let doneIds: string[] = []
      try {
        const progressRes = await fetch(
          `/api/certifications/${certId}/lesson-progress`,
          { cache: 'no-store' }
        )
        if (progressRes.ok) {
          const data = await progressRes.json().catch(() => null)
          if (Array.isArray(data?.completed_lesson_ids)) {
            doneIds = data.completed_lesson_ids
          }
        }
      } catch {
        /* fall through to cache */
      }

      // Offline / API failed — fall back to the learn page's localStorage
      // cache so the stats card doesn't show 0 just because the network
      // hiccupped.
      if (doneIds.length === 0 && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(`arcana-cert-completed-${certId}`)
          const parsed = raw ? JSON.parse(raw) : []
          if (Array.isArray(parsed)) doneIds = parsed
        } catch {
          /* ignore */
        }
      }

      const doneSet = new Set(doneIds)
      setCompletedLessons(lessonsData.filter((l) => doneSet.has(l.id)).length)

      // Group lessons by module, then count modules where every lesson is done.
      const byModule = new Map<string, { total: number; done: number }>()
      for (const lesson of lessonsData) {
        const entry = byModule.get(lesson.module_id) || { total: 0, done: 0 }
        entry.total += 1
        if (doneSet.has(lesson.id)) entry.done += 1
        byModule.set(lesson.module_id, entry)
      }
      const populated = Array.from(byModule.values())
      setModulesWithLessons(populated.length)
      setCompletedModules(populated.filter((m) => m.total > 0 && m.done === m.total).length)
    } catch {
      /* ignore */
    }
  }

  const fetchCertificationDetails = async () => {
    try {
      // Fetch certification
      const certResponse = await fetch('/api/certifications')
      const certs = await certResponse.json()
      const cert = certs.find((c: any) => c.id === certId || c.progress?.cert_id === certId)
      
      if (cert) {
        setCertification(cert.progress ? cert : cert)
      }

      // Fetch modules
      const modulesResponse = await fetch(`/api/certifications/${certId}/modules`)
      if (modulesResponse.ok) {
        const modulesData = await modulesResponse.json()
        setModules(modulesData || [])
      }

      // Fetch progress
      const progressResponse = await fetch('/api/certifications/progress')
      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        const userProgress = progressData.find((p: any) => p.cert_id === certId)
        if (userProgress) {
          setProgress(userProgress)
          setTargetDate(userProgress.target_date || '')
          setExamDate(userProgress.exam_date || '')
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load certification',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (newProgress: number) => {
    try {
      const response = await fetch('/api/certifications/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cert_id: certId,
          progress: newProgress,
        }),
      })

      if (!response.ok) throw new Error('Failed to update progress')

      const updated = await response.json()
      setProgress(updated)

      toast({
        title: 'Progress Updated',
        description: `Your progress is now ${newProgress}%`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update progress',
        variant: 'destructive',
      })
    }
  }

  const fetchModules = async () => {
    try {
      const response = await fetch(`/api/certifications/${certId}/modules`)
      if (response.ok) {
        const data = await response.json()
        setModules(data || [])
      }
    } catch (error: any) {
      console.error('Error fetching modules:', error)
    }
  }

  const handleGenerateModules = async () => {
    if (!certification) return
    
    setAiGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cert_id: certId,
          cert_name: certification.name,
          cert_description: certification.description,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate modules')

      const data = await response.json()
      setModules(data.modules || [])
      
      toast({
        title: 'Success!',
        description: `Generated ${data.modules.length} modules for ${certification.name}`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate modules',
        variant: 'destructive',
      })
    } finally {
      setAiGenerating(false)
    }
  }

  const handleAddModule = async () => {
    if (!moduleTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Module title is required',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/certifications/${certId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: moduleTitle,
          description: moduleDescription || null,
          estimated_hours: moduleHours,
        }),
      })

      if (!response.ok) throw new Error('Failed to add module')

      toast({
        title: 'Success',
        description: 'Module added successfully',
      })

      setModuleTitle('')
      setModuleDescription('')
      setModuleHours(5)
      setAddModuleDialogOpen(false)
      fetchModules()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add module',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteClick = (moduleId: string) => {
    setModuleToDelete(moduleId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return

    try {
      const response = await fetch(`/api/certifications/${certId}/modules/${moduleToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete module')

      toast({
        title: 'Success',
        description: 'Module deleted successfully',
      })

      setDeleteDialogOpen(false)
      setModuleToDelete(null)
      fetchModules()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete module',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateTargetDate = async () => {
    try {
      const response = await fetch('/api/certifications/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cert_id: certId,
          target_date: targetDate || null,
          exam_date: examDate || null,
          exam_scheduled: !!examDate,
        }),
      })

      if (!response.ok) throw new Error('Failed to update dates')

      const updated = await response.json()
      setProgress(updated)
      setTargetDateDialogOpen(false)

      toast({
        title: 'Success',
        description: 'Dates updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update dates',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!certification) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/certifications">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Certifications
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Certification not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentProgress = progress?.progress || 0
  const totalModules = modules.length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/certifications">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{certification.name}</h1>
          <p className="text-muted-foreground">{certification.description}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold">Start learning</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Lessons, quick quizzes, and AI tutoring in one view.
            </p>
          </div>
          <Link href={`/dashboard/certifications/${certId}/learn`}>
            <Button>
              <GraduationCap className="mr-2 h-4 w-4" />
              Open learn view
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        <Link href={`/dashboard/certifications/${certId}/study-plan`}>
          <Button variant="outline">
            <BookOpen className="mr-2 h-4 w-4" />
            Generate AI Study Plan
          </Button>
        </Link>
        <Button
          variant="outline"
          onClick={() => setTargetDateDialogOpen(true)}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Set Dates
        </Button>
        {modules.length === 0 && (
          <Button
            variant="outline"
            onClick={handleGenerateModules}
            disabled={aiGenerating}
          >
            {aiGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                AI Generate Modules
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <EnhancedProgress
                value={currentProgress}
                label="Modules complete"
                animated={true}
                showIcon={true}
                variant={currentProgress === 100 ? 'success' : currentProgress > 75 ? 'default' : currentProgress > 50 ? 'warning' : 'error'}
                size="lg"
              />
            </div>
            {progress?.target_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Target: {new Date(progress.target_date).toLocaleDateString()}</span>
              </div>
            )}
            {progress?.exam_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Exam: {new Date(progress.exam_date).toLocaleDateString()}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              A module counts when every lesson in it is checked off.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {completedModules} / {modulesWithLessons || totalModules || '—'}
            </div>
            <p className="text-sm text-muted-foreground">
              {totalModules === 0
                ? 'No modules yet'
                : modulesWithLessons === 0
                ? 'Generate lessons to start tracking'
                : completedModules === modulesWithLessons
                ? 'All modules complete'
                : `${totalLessons > 0 ? `${completedLessons}/${totalLessons} lessons` : 'modules completed'}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={i < certification.difficulty ? 'text-yellow-500' : 'text-muted'}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Certification difficulty</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Modules</CardTitle>
              <CardDescription>
                Study modules for this certification ({modules.length} total)
              </CardDescription>
            </div>
            <Dialog open={addModuleDialogOpen} onOpenChange={setAddModuleDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Module</DialogTitle>
                  <DialogDescription>
                    Add a new study module to this certification
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="module-title">Module Title *</Label>
                    <Input
                      id="module-title"
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      placeholder="e.g., Networking Fundamentals"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="module-desc">Description</Label>
                    <Textarea
                      id="module-desc"
                      value={moduleDescription}
                      onChange={(e) => setModuleDescription(e.target.value)}
                      placeholder="What this module covers..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="module-hours">Estimated Hours</Label>
                    <Input
                      id="module-hours"
                      type="number"
                      min="1"
                      value={moduleHours}
                      onChange={(e) => setModuleHours(parseInt(e.target.value) || 5)}
                    />
                  </div>
                  <Button onClick={handleAddModule} className="w-full">
                    Add Module
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {modules.length > 0 ? (
            <div className="space-y-3">
              {modules
                .sort((a, b) => a.order_idx - b.order_idx)
                .map((module) => {
                  const isCompleted = false
                  return (
                    <div
                      key={module.id}
                      className="flex items-start gap-4 p-4 rounded-lg border"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{module.title}</h3>
                        {module.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {module.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {module.estimated_hours}h
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleDeleteClick(module.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No modules yet. Add them manually or use AI to generate them!
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setAddModuleDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module Manually
                </Button>
                <Button
                  onClick={handleGenerateModules}
                  disabled={aiGenerating}
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      AI Generate Modules
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Date Dialog */}
      <Dialog open={targetDateDialogOpen} onOpenChange={setTargetDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Target & Exam Dates</DialogTitle>
            <DialogDescription>
              Set when you want to complete this certification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="target-date">Target Completion Date</Label>
              <Input
                id="target-date"
                type="date"
                value={targetDate || progress?.target_date || ''}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam-date">Exam Date (Optional)</Label>
              <Input
                id="exam-date"
                type="date"
                value={examDate || progress?.exam_date || ''}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
            <Button onClick={handleUpdateTargetDate} className="w-full">
              Save Dates
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Module Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this module? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

