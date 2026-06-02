'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BookOpen,
  ArrowLeft,
  Brain,
  PlayCircle,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  Menu,
  X,
  Trophy,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { LessonViewer } from '@/components/learning/lesson-viewer'
import { QuizInterface } from '@/components/learning/quiz-interface'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const completedKey = (certId: string) => `arcana-cert-completed-${certId}`

function loadCompleted(certId: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(completedKey(certId))
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function saveCompleted(certId: string, ids: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      completedKey(certId),
      JSON.stringify(Array.from(ids))
    )
  } catch {
    /* ignore */
  }
}

interface QuizQuestion {
  id: string
  question: string
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank'
  options?: string[]
  correct_answer: string
  explanation: string
  difficulty_level: number
}

interface Module {
  id: string
  title: string
  description: string | null
  estimated_hours: number
  order_idx: number
}

interface Lesson {
  id: string
  module_id: string
  title: string
  description: string | null
  estimated_minutes: number
  difficulty_level: number
  order_idx: number
  cert_lesson_content?: Array<{
    content_type: string
    content_data: any
  }>
}

export default function LearnPage() {
  const params = useParams()
  const router = useRouter()
  const certId = params.id as string
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [certificationName, setCertificationName] = useState<string>('')
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])

  useEffect(() => {
    setCompletedLessons(loadCompleted(certId))
  }, [certId])

  const totalLessons = lessons.length
  const completedCount = useMemo(
    () => lessons.filter((l) => completedLessons.has(l.id)).length,
    [lessons, completedLessons]
  )
  const certProgressPct = useMemo(
    () => (totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0),
    [completedCount, totalLessons]
  )

  const persistCertProgress = async (pct: number) => {
    try {
      await fetch('/api/certifications/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cert_id: certId, progress: pct }),
      })
    } catch (err) {
      console.error('Failed to persist cert progress:', err)
    }
  }

  const handleLessonComplete = async (lessonId: string) => {
    if (completedLessons.has(lessonId)) return
    const next = new Set(completedLessons)
    next.add(lessonId)
    setCompletedLessons(next)
    saveCompleted(certId, next)

    const newCompletedCount = lessons.filter((l) => next.has(l.id)).length
    const newPct = totalLessons > 0
      ? Math.round((newCompletedCount / totalLessons) * 100)
      : 0

    await persistCertProgress(newPct)

    toast({
      title: 'Lesson completed',
      description:
        newPct === 100
          ? 'You finished every lesson. Time to schedule the exam.'
          : `Cert progress: ${newPct}%`,
    })
  }

  const openQuickQuiz = async () => {
    if (!selectedLesson) return
    setQuizOpen(true)
    setQuizLoading(true)
    setQuizQuestions([])
    try {
      const res = await fetch('/api/ai/lesson-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_title: selectedLesson.title,
          lesson_description: selectedLesson.description,
          certification_name: certificationName,
          difficulty: selectedLesson.difficulty_level || 2,
          num_questions: 5,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to generate quiz')
      }
      const data = await res.json()
      setQuizQuestions(data.questions || [])
    } catch (err: any) {
      toast({
        title: 'Quiz failed',
        description: err.message || 'Could not generate a quiz right now',
        variant: 'destructive',
      })
      setQuizOpen(false)
    } finally {
      setQuizLoading(false)
    }
  }

  useEffect(() => {
    fetchModulesAndLessons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certId])

  const fetchModulesAndLessons = async () => {
    try {
      setLoading(true)

      const certsRes = await fetch('/api/certifications')
      if (certsRes.ok) {
        const certs = await certsRes.json()
        const cert = (certs || []).find((c: any) => c.id === certId)
        if (cert?.name) setCertificationName(cert.name)
      }

      const modulesRes = await fetch(`/api/certifications/${certId}/modules`)
      if (modulesRes.ok) {
        const modulesData = await modulesRes.json()
        setModules(modulesData || [])
        if (modulesData && modulesData.length > 0) {
          setSelectedModuleId(modulesData[0].id)
        }
      }

      const lessonsRes = await fetch(`/api/certifications/${certId}/lessons`)
      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json()
        setLessons(lessonsData || [])
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load content',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateLessons = async (moduleId: string) => {
    try {
      setGenerating(true)
      const response = await fetch(`/api/certifications/${certId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: moduleId }),
      })

      if (!response.ok) throw new Error('Failed to generate lessons')

      toast({
        title: 'Success!',
        description: 'Lessons generated successfully. Refreshing...',
      })

      // Refresh lessons
      await fetchModulesAndLessons()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate lessons',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const moduleLessons = lessons.filter(l => l.module_id === selectedModuleId)
  const selectedModule = modules.find(m => m.id === selectedModuleId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading learning content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar - Table of Contents */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col"
          >
            <Card className="rounded-none border-x-0 border-t-0 h-full flex flex-col">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Modules</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/certifications/${certId}`)}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Certification
                </Button>
              </CardHeader>

              <ScrollArea className="flex-1">
                <CardContent className="p-4 space-y-4">
                  {modules.map((module) => {
                    const moduleLessonsCount = lessons.filter(l => l.module_id === module.id).length
                    const isSelected = selectedModuleId === module.id
                    const hasLessons = moduleLessonsCount > 0

                    return (
                      <motion.div
                        key={module.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Card
                          className={cn(
                            'cursor-pointer transition-all duration-300 overflow-hidden',
                            isSelected
                              ? 'border-primary shadow-lg ring-2 ring-primary/20'
                              : 'hover:shadow-md hover:border-primary/50'
                          )}
                          onClick={() => {
                            setSelectedModuleId(module.id)
                            const firstLesson = lessons.find(l => l.module_id === module.id)
                            if (firstLesson) setSelectedLesson(firstLesson)
                            else setSelectedLesson(null)
                          }}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base font-semibold line-clamp-2">
                                {module.title}
                              </CardTitle>
                              <Badge variant="outline" className="ml-2 flex-shrink-0">
                                {module.estimated_hours}h
                              </Badge>
                            </div>
                            {module.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {module.description}
                              </p>
                            )}
                          </CardHeader>

                          {isSelected && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                            >
                              <CardContent className="pt-0 space-y-2">
                                {!hasLessons && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleGenerateLessons(module.id)
                                    }}
                                    disabled={generating}
                                  >
                                    {generating ? (
                                      <>
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                        Generating…
                                      </>
                                    ) : (
                                      'Generate lessons'
                                    )}
                                  </Button>
                                )}

                                {lessons
                                  .filter(l => l.module_id === module.id)
                                  .sort((a, b) => a.order_idx - b.order_idx)
                                  .map((lesson, idx) => {
                                    const isDone = completedLessons.has(lesson.id)
                                    const isActive = selectedLesson?.id === lesson.id
                                    return (
                                      <motion.div
                                        key={lesson.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={cn(
                                          'flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all',
                                          isActive
                                            ? 'bg-primary/10 border border-primary/20'
                                            : 'hover:bg-muted'
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedLesson(lesson)
                                        }}
                                      >
                                        {isDone ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        ) : isActive ? (
                                          <PlayCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                        ) : (
                                          <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className={cn(
                                            'text-sm font-medium truncate',
                                            isDone && 'text-muted-foreground line-through'
                                          )}>
                                            {lesson.title}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                              {lesson.estimated_minutes} min
                                            </span>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )
                                  })}
                              </CardContent>
                            </motion.div>
                          )}
                        </Card>
                      </motion.div>
                    )
                  })}
                </CardContent>
              </ScrollArea>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            {selectedModule && (
              <div>
                <h2 className="text-xl font-semibold">{selectedModule.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {moduleLessons.length} lesson{moduleLessons.length !== 1 ? 's' : ''}
                  {totalLessons > 0 && (
                    <>
                      {' · '}
                      <span className="text-foreground font-medium">
                        {completedCount}/{totalLessons}
                      </span>
                      {' done overall'}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openQuickQuiz}
              disabled={!selectedLesson}
              title={selectedLesson ? 'Generate a 5-question quiz on this lesson' : 'Select a lesson first'}
            >
              <Trophy className="mr-2 h-4 w-4" />
              Quick Quiz
            </Button>
            <Link
              href={
                selectedLesson
                  ? `/dashboard/chat?cert_id=${certId}&prompt=${encodeURIComponent(
                      `Help me understand the "${selectedLesson.title}" lesson${
                        certificationName ? ` from ${certificationName}` : ''
                      }. What should I focus on?`
                    )}`
                  : '/dashboard/chat'
              }
            >
              <Button variant="outline" size="sm">
                <Brain className="mr-2 h-4 w-4" />
                Ask Arcana
              </Button>
            </Link>
          </div>
        </div>

        {/* Lesson Content */}
        <ScrollArea className="flex-1">
          <div className="container max-w-5xl mx-auto p-6">
            {selectedLesson ? (
              <LessonViewer
                lesson={{
                  ...selectedLesson,
                  description: selectedLesson.description ?? undefined,
                }}
                content={{
                  intro: selectedLesson.cert_lesson_content?.find(c => c.content_type === 'intro')?.content_data?.intro,
                  concepts: selectedLesson.cert_lesson_content?.find(c => c.content_type === 'concepts')?.content_data?.concepts,
                  practical: selectedLesson.cert_lesson_content?.find(c => c.content_type === 'practical')?.content_data?.practical,
                  summary: selectedLesson.cert_lesson_content?.find(c => c.content_type === 'summary')?.content_data?.summary,
                }}
                isCompleted={completedLessons.has(selectedLesson.id)}
                onComplete={() => handleLessonComplete(selectedLesson.id)}
              />
            ) : (
              <div className="text-center py-20 max-w-md mx-auto">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-1">Pick a lesson</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose one from the sidebar, or generate lessons if this module is empty.
                </p>
                {selectedModule && moduleLessons.length === 0 && (
                  <Button
                    onClick={() => handleGenerateLessons(selectedModule.id)}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      'Generate lessons'
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog
        open={quizOpen}
        onOpenChange={(open) => {
          setQuizOpen(open)
          if (!open) setQuizQuestions([])
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Quick Quiz {selectedLesson ? `· ${selectedLesson.title}` : ''}
            </DialogTitle>
            <DialogDescription>
              Five AI-generated questions to test what you just read.
            </DialogDescription>
          </DialogHeader>
          {quizLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Arcana is writing your questions…
              </p>
            </div>
          ) : quizQuestions.length > 0 ? (
            <QuizInterface
              questions={quizQuestions}
              quizTitle={selectedLesson?.title || 'Lesson Quiz'}
              onComplete={(score) => {
                if (score >= 80 && selectedLesson) {
                  handleLessonComplete(selectedLesson.id)
                }
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No questions generated. Try again.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

