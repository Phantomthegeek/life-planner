'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  ArrowLeft, 
  Brain, 
  Sparkles,
  PlayCircle,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  Menu,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { LessonViewer } from '@/components/learning/lesson-viewer'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

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

  useEffect(() => {
    fetchModulesAndLessons()
  }, [certId])

  const fetchModulesAndLessons = async () => {
    try {
      setLoading(true)

      // Fetch modules
      const modulesRes = await fetch(`/api/certifications/${certId}/modules`)
      if (modulesRes.ok) {
        const modulesData = await modulesRes.json()
        setModules(modulesData || [])
        if (modulesData && modulesData.length > 0) {
          setSelectedModuleId(modulesData[0].id)
        }
      }

      // Fetch lessons
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
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Table of Contents</CardTitle>
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
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                                        Generating...
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="mr-2 h-3 w-3" />
                                        Generate Lessons
                                      </>
                                    )}
                                  </Button>
                                )}

                                {lessons
                                  .filter(l => l.module_id === module.id)
                                  .sort((a, b) => a.order_idx - b.order_idx)
                                  .map((lesson, idx) => (
                                    <motion.div
                                      key={lesson.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className={cn(
                                        'flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all',
                                        selectedLesson?.id === lesson.id
                                          ? 'bg-primary/10 border border-primary/20'
                                          : 'hover:bg-muted'
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedLesson(lesson)
                                      }}
                                    >
                                      {selectedLesson?.id === lesson.id ? (
                                        <PlayCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                      ) : (
                                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
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
                                  ))}
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
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Brain className="mr-2 h-4 w-4" />
              AI Tutor
            </Button>
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
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Select a Lesson</h3>
                <p className="text-muted-foreground mb-6">
                  Choose a lesson from the sidebar to start learning
                </p>
                {selectedModule && moduleLessons.length === 0 && (
                  <Button
                    onClick={() => handleGenerateLessons(selectedModule.id)}
                    disabled={generating}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Generating Lessons...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Lessons with AI
                      </>
                    )}
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

