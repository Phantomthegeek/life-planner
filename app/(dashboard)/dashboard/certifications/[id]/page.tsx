'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EnhancedProgress, CircularProgress } from '@/components/progress/enhanced-progress'
import { BookOpen, Calendar, CheckCircle2, Circle, Loader2, ArrowLeft, Plus, Brain, Edit, Trash2, Sparkles, Clock, GraduationCap, Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  const { toast } = useToast()

  useEffect(() => {
    fetchCertificationDetails()
  }, [certId])

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

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return

    try {
      const response = await fetch(`/api/certifications/${certId}/modules/${moduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete module')

      toast({
        title: 'Success',
        description: 'Module deleted successfully',
      })

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
  const completedModules = Math.round((currentProgress / 100) * totalModules)

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

      {/* Main Action - Start Learning */}
      <Card className="border-2 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Ready to Learn?
              </h2>
              <p className="text-muted-foreground">
                Access interactive lessons, quizzes, flashcards, and AI-powered tutoring
              </p>
            </div>
            <Link href={`/dashboard/certifications/${certId}/learn`}>
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl transition-all">
                <GraduationCap className="mr-2 h-5 w-5" />
                Start Learning
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
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
                label="Overall Progress"
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
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateProgress(Math.max(0, currentProgress - 5))}
              >
                -5%
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateProgress(Math.min(100, currentProgress + 5))}
              >
                +5%
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedModules} / {totalModules}</div>
            <p className="text-sm text-muted-foreground">Modules completed</p>
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
                .map((module, idx) => {
                  const isCompleted = idx < completedModules
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
                          <DropdownMenuItem onClick={() => handleDeleteModule(module.id)}>
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
    </div>
  )
}

