'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  CheckCircle2, 
  Lightbulb, 
  Target, 
  Zap,
  ChevronRight,
  PlayCircle,
  Clock,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface LessonContent {
  intro?: {
    overview: string
    learning_objectives: string[]
    key_takeaways: string[]
  }
  concepts?: Array<{
    title: string
    explanation: string
    examples: string[]
    analogies: string[]
  }>
  practical?: {
    real_world_scenarios: string[]
    common_use_cases: string[]
    best_practices: string[]
  }
  summary?: {
    recap: string
    key_points: string[]
    next_steps: string[]
  }
}

interface LessonViewerProps {
  lesson: {
    id: string
    title: string
    description?: string
    estimated_minutes: number
    difficulty_level: number
  }
  content: LessonContent
  progress?: number
  onComplete?: () => void
  isCompleted?: boolean
}

export function LessonViewer({ 
  lesson, 
  content, 
  progress = 0,
  onComplete,
  isCompleted = false
}: LessonViewerProps) {
  const [activeSection, setActiveSection] = useState<'intro' | 'concepts' | 'practical' | 'summary'>('intro')
  const [expandedConcepts, setExpandedConcepts] = useState<Set<number>>(new Set())

  const toggleConcept = (index: number) => {
    const newExpanded = new Set(expandedConcepts)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedConcepts(newExpanded)
  }

  const sections = [
    { id: 'intro', label: 'Overview', icon: PlayCircle, color: 'bg-blue-500' },
    { id: 'concepts', label: 'Concepts', icon: Lightbulb, color: 'bg-purple-500' },
    { id: 'practical', label: 'Practice', icon: Target, color: 'bg-green-500' },
    { id: 'summary', label: 'Summary', icon: Award, color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="text-muted-foreground text-lg">{lesson.description}</p>
            )}
          </div>
          {isCompleted && (
            <Badge className="bg-green-500 hover:bg-green-600 gap-2 px-4 py-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{lesson.estimated_minutes} min</span>
          </div>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            Level {lesson.difficulty_level}/5
          </Badge>
          {progress > 0 && (
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id
          const hasContent = content[section.id as keyof LessonContent]
          
          return (
            <motion.button
              key={section.id}
              onClick={() => hasContent && setActiveSection(section.id as any)}
              disabled={!hasContent}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300',
                'min-w-fit',
                isActive
                  ? `${section.color} text-white shadow-lg scale-105`
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground',
                !hasContent && 'opacity-50 cursor-not-allowed'
              )}
              whileHover={hasContent ? { scale: 1.05 } : {}}
              whileTap={hasContent ? { scale: 0.95 } : {}}
            >
              <Icon className="h-4 w-4" />
              <span>{section.label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 shadow-xl">
            <CardContent className="p-8">
              {/* Intro Section */}
              {activeSection === 'intro' && content.intro && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <PlayCircle className="h-6 w-6 text-blue-500" />
                      Overview
                    </h2>
                    <p className="text-lg leading-relaxed text-foreground/90">
                      {content.intro.overview}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          Learning Objectives
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {content.intro.learning_objectives?.map((objective, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-start gap-2"
                            >
                              <ChevronRight className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                              <span>{objective}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          Key Takeaways
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {content.intro.key_takeaways?.map((takeaway, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-start gap-2"
                            >
                              <ChevronRight className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                              <span>{takeaway}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Concepts Section */}
              {activeSection === 'concepts' && content.concepts && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Lightbulb className="h-6 w-6 text-purple-500" />
                    Core Concepts
                  </h2>
                  <div className="space-y-4">
                    {content.concepts.map((concept, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
                          <CardHeader
                            className="cursor-pointer bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900"
                            onClick={() => toggleConcept(idx)}
                          >
                            <CardTitle className="flex items-center justify-between">
                              <span className="text-lg">{concept.title}</span>
                              <ChevronRight
                                className={cn(
                                  'h-5 w-5 transition-transform duration-300',
                                  expandedConcepts.has(idx) && 'rotate-90'
                                )}
                              />
                            </CardTitle>
                          </CardHeader>
                          <AnimatePresence>
                            {expandedConcepts.has(idx) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <CardContent className="pt-4 space-y-4">
                                  <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                    {concept.explanation}
                                  </p>

                                  {concept.examples && concept.examples.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-green-500" />
                                        Examples
                                      </h4>
                                      <ul className="space-y-2 ml-6">
                                        {concept.examples.map((example, exIdx) => (
                                          <li key={exIdx} className="list-disc text-foreground/80">
                                            {example}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {concept.analogies && concept.analogies.length > 0 && (
                                    <div className="bg-muted/50 rounded-lg p-4">
                                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-blue-500" />
                                        Analogies
                                      </h4>
                                      <ul className="space-y-2">
                                        {concept.analogies.map((analogy, anIdx) => (
                                          <li key={anIdx} className="text-foreground/80 italic">
                                            &quot;{analogy}&quot;
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </CardContent>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practical Section */}
              {activeSection === 'practical' && content.practical && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Target className="h-6 w-6 text-green-500" />
                    Practical Applications
                  </h2>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                      <CardHeader>
                        <CardTitle className="text-lg">Real-World Scenarios</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {content.practical.real_world_scenarios?.map((scenario, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                              <span>{scenario}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                      <CardHeader>
                        <CardTitle className="text-lg">Common Use Cases</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {content.practical.common_use_cases?.map((useCase, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                              <span>{useCase}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                      <CardHeader>
                        <CardTitle className="text-lg">Best Practices</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {content.practical.best_practices?.map((practice, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                              <span>{practice}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Summary Section */}
              {activeSection === 'summary' && content.summary && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Award className="h-6 w-6 text-orange-500" />
                    Summary
                  </h2>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-6">
                      <p className="text-lg leading-relaxed mb-6">
                        {content.summary.recap}
                      </p>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold mb-3">Key Points</h3>
                          <ul className="space-y-2">
                            {content.summary.key_points?.map((point, idx) => (
                              <motion.li
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-start gap-2"
                              >
                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Next Steps</h3>
                          <ul className="space-y-2">
                            {content.summary.next_steps?.map((step, idx) => (
                              <motion.li
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-start gap-2"
                              >
                                <ChevronRight className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span>{step}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {onComplete && !isCompleted && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                        onClick={onComplete}
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Mark Lesson as Complete
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

