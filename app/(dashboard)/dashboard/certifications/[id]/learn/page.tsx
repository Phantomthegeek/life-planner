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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { LessonViewer } from '@/components/learning/lesson-viewer'
import { QuizInterface } from '@/components/learning/quiz-interface'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// localStorage is now a write-through cache, not the source of truth. The
// server (cert_progress_detailed) owns lesson completion so it syncs across
// devices. We still cache locally so:
//   1. The UI paints something immediately on load before the GET resolves.
//   2. If the user goes offline mid-session, the completion list stays usable.
//   3. We can detect orphaned localStorage data and migrate it on first load.
const completedKey = (certId: string) => `arcana-cert-completed-${certId}`
// Marker so we only attempt the legacy-localStorage migration once per cert.
const migrationKey = (certId: string) => `arcana-cert-completed-migrated-${certId}`

function loadCompletedFromCache(certId: string): Set<string> {
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

function writeCompletedCache(certId: string, ids: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      completedKey(certId),
      JSON.stringify(Array.from(ids))
    )
  } catch {
    /* ignore quota or privacy-mode errors */
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
  // On desktop the modules panel sits beside the content. On mobile it's an
  // overlay drawer that defaults to closed so the lesson is actually readable.
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [certificationName, setCertificationName] = useState<string>('')
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  // Confirmation dialog for regenerate (mobile-friendly replacement for confirm()).
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false)
  const [regenTargetModule, setRegenTargetModule] = useState<{
    moduleId: string
    existingCount: number
  } | null>(null)
  // Confirmation dialog for per-lesson delete.
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<string | null>(null)

  // Hydrate completion state in two phases:
  //   1. Synchronously from localStorage so the UI doesn't flash empty.
  //   2. Asynchronously from the server, which becomes the source of truth.
  //
  // If we discover legacy localStorage data on the first server load and the
  // server has none of it, push it up so users don't lose progress from
  // before this feature existed. After that the local cache is just a mirror.
  useEffect(() => {
    setCompletedLessons(loadCompletedFromCache(certId))

    let cancelled = false

    const syncFromServer = async () => {
      try {
        const res = await fetch(`/api/certifications/${certId}/lesson-progress`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          // 401 / 500 / offline — keep the cache, sync next visit.
          return
        }
        const data = await res.json().catch(() => null) as
          | { completed_lesson_ids?: string[] }
          | null
        if (cancelled) return

        const serverIds = new Set<string>(data?.completed_lesson_ids || [])

        // First-visit migration: localStorage had completions, server doesn't.
        const cached = loadCompletedFromCache(certId)
        const alreadyMigrated =
          typeof window !== 'undefined' &&
          !!window.localStorage.getItem(migrationKey(certId))
        const needsMigration =
          !alreadyMigrated && cached.size > 0 && serverIds.size === 0

        if (needsMigration) {
          try {
            await fetch(`/api/certifications/${certId}/lesson-progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lesson_ids: Array.from(cached) }),
            })
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(migrationKey(certId), '1')
            }
            // Server is now authoritative and matches the cache.
            setCompletedLessons(cached)
          } catch {
            // Migration failed — leave cache in place and try again later.
          }
          return
        }

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(migrationKey(certId), '1')
        }
        setCompletedLessons(serverIds)
        writeCompletedCache(certId, serverIds)
      } catch {
        // Network failure — silently fall back to the cache that we already
        // applied in the synchronous step above.
      }
    }

    syncFromServer()
    return () => {
      cancelled = true
    }
  }, [certId])

  // Track viewport so we can default the drawer to closed on mobile and make
  // sidebar interactions behave like a modal overlay there.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(max-width: 767px)')
    const apply = () => {
      const mobile = mql.matches
      setIsMobile(mobile)
      // Auto-close drawer when crossing into mobile; auto-open on desktop.
      setSidebarOpen(!mobile)
    }
    apply()
    mql.addEventListener('change', apply)
    return () => mql.removeEventListener('change', apply)
  }, [])

  const totalLessons = lessons.length
  const completedCount = useMemo(
    () => lessons.filter((l) => completedLessons.has(l.id)).length,
    [lessons, completedLessons]
  )

  // Course progress is *module-based*: a module counts as complete when every
  // one of its lessons is checked off. Empty modules (no lessons yet) don't
  // count toward the denominator — otherwise a fresh course would show 0%
  // even though there's nothing to do yet.
  const moduleProgress = useMemo(() => {
    const modulesWithLessons = modules.filter((m) =>
      lessons.some((l) => l.module_id === m.id)
    )
    if (modulesWithLessons.length === 0) {
      return { complete: 0, total: 0, pct: 0 }
    }
    const complete = modulesWithLessons.filter((m) => {
      const ls = lessons.filter((l) => l.module_id === m.id)
      return ls.length > 0 && ls.every((l) => completedLessons.has(l.id))
    }).length
    return {
      complete,
      total: modulesWithLessons.length,
      pct: Math.round((complete / modulesWithLessons.length) * 100),
    }
  }, [modules, lessons, completedLessons])

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

  // Recompute module progress with a forward-looking `next` set so we can
  // call this from handlers that just toggled a lesson without waiting for
  // React state to flush.
  const computeModulePct = (nextCompleted: Set<string>): number => {
    const modulesWithLessons = modules.filter((m) =>
      lessons.some((l) => l.module_id === m.id)
    )
    if (modulesWithLessons.length === 0) return 0
    const complete = modulesWithLessons.filter((m) => {
      const ls = lessons.filter((l) => l.module_id === m.id)
      return ls.length > 0 && ls.every((l) => nextCompleted.has(l.id))
    }).length
    return Math.round((complete / modulesWithLessons.length) * 100)
  }

  const handleLessonComplete = async (lessonId: string) => {
    if (completedLessons.has(lessonId)) return
    const next = new Set(completedLessons)
    next.add(lessonId)
    // Optimistic: update UI + write-through cache immediately so the user
    // sees the tick instantly. Server writes happen below.
    setCompletedLessons(next)
    writeCompletedCache(certId, next)

    const newPct = computeModulePct(next)

    // Persist both the per-lesson completion (for cross-device sync) AND the
    // cert-level summary (so the certs list and dashboard cards don't lag
    // behind). We do these in parallel — the lesson-progress call is the
    // one that matters most; the summary is derived.
    const lessonProgressPromise = fetch(
      `/api/certifications/${certId}/lesson-progress`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, status: 'completed' }),
      }
    ).catch((err) => {
      console.error('Failed to persist lesson completion:', err)
      return null
    })

    const [lessonProgressRes] = await Promise.all([
      lessonProgressPromise,
      persistCertProgress(newPct),
    ])

    // If the server rejected the write, surface a non-blocking warning so the
    // user knows it might not be on other devices. We don't roll back the UI
    // because the cache still reflects their intent.
    if (lessonProgressRes && !lessonProgressRes.ok) {
      console.warn('Lesson progress write failed', await lessonProgressRes.text().catch(() => ''))
      toast({
        title: 'Saved locally',
        description: 'We couldn\u2019t sync this to your other devices. We\u2019ll retry next time you open the lesson.',
        variant: 'destructive',
      })
    }

    // Did this lesson just complete its module? Give the user a clearer ping.
    const lesson = lessons.find((l) => l.id === lessonId)
    const moduleLessonsAll = lesson
      ? lessons.filter((l) => l.module_id === lesson.module_id)
      : []
    const justFinishedModule =
      moduleLessonsAll.length > 0 &&
      moduleLessonsAll.every((l) => next.has(l.id))

    if (lessonProgressRes?.ok ?? true) {
      toast({
        title: justFinishedModule ? 'Module complete' : 'Lesson complete',
        description:
          newPct === 100
            ? 'You finished every module. Time to schedule the exam.'
            : `Course progress: ${newPct}%`,
      })
    }
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

  const handleGenerateLessons = async (moduleId: string, regenerate = false) => {
    try {
      setGenerating(true)
      const response = await fetch(`/api/certifications/${certId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: moduleId, regenerate }),
      })

      const data = await response.json().catch(() => ({}))

      // 409 = lessons already exist. Pop a real dialog instead of window.confirm
      // so the experience is tolerable on mobile.
      if (response.status === 409) {
        setRegenTargetModule({
          moduleId,
          existingCount: typeof data.existing_count === 'number' ? data.existing_count : 0,
        })
        setRegenConfirmOpen(true)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate lessons')
      }

      const count = Array.isArray(data.lessons) ? data.lessons.length : 0
      toast({
        title: count > 0 ? `Generated ${count} lesson${count === 1 ? '' : 's'}` : 'Done',
        description: data.warning || 'Refreshing…',
        variant: data.warning ? 'destructive' : 'default',
      })

      // Regenerating replaces the lesson rows. The cascading FK on
      // cert_progress_detailed cleans the old completion rows, but our
      // in-memory set still has the dead IDs. Drop completions for this
      // module so the UI doesn't show ghost ticks.
      if (regenerate) {
        const next = new Set(completedLessons)
        for (const lesson of lessons) {
          if (lesson.module_id === moduleId) next.delete(lesson.id)
        }
        setCompletedLessons(next)
        writeCompletedCache(certId, next)
      }

      await fetchModulesAndLessons()
    } catch (error: any) {
      toast({
        title: 'Lesson generation failed',
        description: error.message || 'Try again in a moment.',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const confirmDeleteLesson = async () => {
    const lessonId = deleteLessonTarget
    if (!lessonId) return
    setDeleteLessonTarget(null)
    try {
      const res = await fetch(
        `/api/certifications/${certId}/lessons?lesson_id=${lessonId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete lesson')
      }
      if (selectedLesson?.id === lessonId) setSelectedLesson(null)
      const next = new Set(completedLessons)
      next.delete(lessonId)
      setCompletedLessons(next)
      writeCompletedCache(certId, next)

      // Best-effort: also wipe the server completion row so the lesson
      // doesn't reappear as "complete" if the user regenerates it later
      // with the same ID, and so other devices don't keep a stale tick.
      // FK from cert_progress_detailed.lesson_id has ON DELETE cascade so
      // this is also self-healing once the cert_lessons row is gone, but
      // doing it explicitly here makes the intent clear.
      fetch(
        `/api/certifications/${certId}/lesson-progress?lesson_id=${lessonId}`,
        { method: 'DELETE' }
      ).catch(() => {})

      // Recompute cert % so other surfaces don't lag behind.
      const newPct = computeModulePct(next)
      persistCertProgress(newPct).catch(() => {})

      await fetchModulesAndLessons()
      toast({ title: 'Lesson deleted' })
    } catch (error: any) {
      toast({
        title: 'Could not delete lesson',
        description: error.message,
        variant: 'destructive',
      })
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
      {/* Backdrop only matters when the drawer is opened on mobile. */}
      {isMobile && sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Table of Contents. Overlay drawer on mobile (absolute +
          z-40), inline column on desktop. */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-[85vw] max-w-sm md:w-80 border-r bg-background flex flex-col absolute inset-y-0 left-0 z-40 md:relative md:z-auto md:bg-background/95 md:backdrop-blur md:supports-[backdrop-filter]:bg-background/60"
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

                                {hasLessons && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleGenerateLessons(module.id, true)
                                    }}
                                    disabled={generating}
                                  >
                                    {generating ? (
                                      <>
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                        Regenerating…
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="mr-2 h-3 w-3" />
                                        Regenerate lessons
                                      </>
                                    )}
                                  </Button>
                                )}

                                {lessons
                                  .filter(l => l.module_id === module.id)
                                  .sort((a, b) => a.order_idx - b.order_idx)
                                  .map((lesson) => {
                                    const isDone = completedLessons.has(lesson.id)
                                    const isActive = selectedLesson?.id === lesson.id
                                    return (
                                      <div
                                        key={lesson.id}
                                        className={cn(
                                          'group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors',
                                          isActive
                                            ? 'bg-primary/10 border border-primary/20'
                                            : 'hover:bg-muted'
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedLesson(lesson)
                                          if (isMobile) setSidebarOpen(false)
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
                                        {/* Always visible on touch (md:opacity-0 means
                                            hover-revealed only on desktop+). */}
                                        <button
                                          type="button"
                                          aria-label="Delete lesson"
                                          className="md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setDeleteLessonTarget(lesson.id)
                                          }}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
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
        {/* Top Bar - stacks on small screens so the title isn't squeezed
            between the menu button and the action buttons. */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 py-3 md:px-6 md:py-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="flex-shrink-0"
                aria-label="Open modules"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            {selectedModule && (
              <div className="min-w-0">
                <h2 className="text-base md:text-xl font-semibold truncate">{selectedModule.title}</h2>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {moduleLessons.length} lesson{moduleLessons.length !== 1 ? 's' : ''}
                  {moduleProgress.total > 0 && (
                    <>
                      {' · '}
                      <span className="text-foreground font-medium">
                        {moduleProgress.complete}/{moduleProgress.total}
                      </span>
                      <span className="hidden sm:inline"> modules done</span>
                      {totalLessons > 0 && (
                        <span className="text-muted-foreground hidden sm:inline">
                          {' '}({completedCount}/{totalLessons} lessons)
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={openQuickQuiz}
              disabled={!selectedLesson}
              title={selectedLesson ? 'Generate a 5-question quiz on this lesson' : 'Select a lesson first'}
              className="h-9"
            >
              <Trophy className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Quick Quiz</span>
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
              <Button variant="outline" size="sm" className="h-9">
                <Brain className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Ask Arcana</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Lesson Content */}
        <ScrollArea className="flex-1">
          <div className="container max-w-5xl mx-auto p-4 md:p-6">
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

      {/* Regenerate confirmation - replaces window.confirm so it works
          properly on touch devices. */}
      <AlertDialog
        open={regenConfirmOpen}
        onOpenChange={(open) => {
          setRegenConfirmOpen(open)
          if (!open) setRegenTargetModule(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate lessons?</AlertDialogTitle>
            <AlertDialogDescription>
              This module already has{' '}
              {regenTargetModule?.existingCount
                ? `${regenTargetModule.existingCount} lessons`
                : 'lessons'}
              . Regenerating will replace them with new AI-generated content.
              Your local progress for this module will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = regenTargetModule
                setRegenConfirmOpen(false)
                setRegenTargetModule(null)
                if (target) handleGenerateLessons(target.moduleId, true)
              }}
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Per-lesson delete confirmation. */}
      <AlertDialog
        open={!!deleteLessonTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteLessonTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              The lesson content will be removed permanently. You can regenerate
              the whole module later if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLesson}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

