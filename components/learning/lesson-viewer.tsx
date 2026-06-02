'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  Lightbulb,
  Target,
  Zap,
  ChevronRight,
  PlayCircle,
  Clock,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    { id: 'intro', label: 'Overview', icon: PlayCircle },
    { id: 'concepts', label: 'Concepts', icon: Lightbulb },
    { id: 'practical', label: 'Practice', icon: Target },
    { id: 'summary', label: 'Summary', icon: Award },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-muted-foreground mt-2">{lesson.description}</p>
            )}
          </div>
          {isCompleted && (
            <Badge variant="outline" className="gap-1.5 flex-shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              Completed
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {lesson.estimated_minutes} min
          </span>
          <span aria-hidden>·</span>
          <span>Level {lesson.difficulty_level}/5</span>
          {progress > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="flex-1 max-w-[200px] flex items-center gap-2">
                <Progress value={progress} className="h-1.5 flex-1" />
                <span className="text-xs">{progress}%</span>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id
          const hasContent = content[section.id as keyof LessonContent]

          return (
            <button
              key={section.id}
              onClick={() => hasContent && setActiveSection(section.id as any)}
              disabled={!hasContent}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
                !hasContent && 'opacity-40 cursor-not-allowed hover:text-muted-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {section.label}
            </button>
          )
        })}
      </div>

      <div key={activeSection}>
          <Card>
            <CardContent className="p-6 md:p-8">
              {activeSection === 'intro' && content.intro && (
                <div className="space-y-8">
                  <div>
                    <p className="text-base leading-relaxed">{content.intro.overview}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                        <Target className="h-3.5 w-3.5" />
                        Learning objectives
                      </h3>
                      <ul className="space-y-2">
                        {content.intro.learning_objectives?.map((objective, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span>{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5" />
                        Key takeaways
                      </h3>
                      <ul className="space-y-2">
                        {content.intro.key_takeaways?.map((takeaway, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'concepts' && content.concepts && (
                <div className="space-y-3">
                  {content.concepts.map((concept, idx) => {
                    const expanded = expandedConcepts.has(idx)
                    return (
                      <div key={idx} className="border rounded-md">
                        <button
                          type="button"
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
                          onClick={() => toggleConcept(idx)}
                          aria-expanded={expanded}
                        >
                          <span className="font-medium">{concept.title}</span>
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 text-muted-foreground transition-transform',
                              expanded && 'rotate-90'
                            )}
                          />
                        </button>
                        {expanded && (
                          <div className="px-4 pb-4 space-y-4 border-t pt-4">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {concept.explanation}
                            </p>

                            {concept.examples && concept.examples.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                  Examples
                                </h4>
                                <ul className="space-y-1 ml-4 list-disc text-sm">
                                  {concept.examples.map((example, exIdx) => (
                                    <li key={exIdx}>{example}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {concept.analogies && concept.analogies.length > 0 && (
                              <div className="bg-muted/40 rounded-md p-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                  Analogies
                                </h4>
                                <ul className="space-y-1 text-sm italic">
                                  {concept.analogies.map((analogy, anIdx) => (
                                    <li key={anIdx}>&quot;{analogy}&quot;</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {activeSection === 'practical' && content.practical && (
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Real-world scenarios
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {content.practical.real_world_scenarios?.map((scenario, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                          <span>{scenario}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Common use cases
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {content.practical.common_use_cases?.map((useCase, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Best practices
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {content.practical.best_practices?.map((practice, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                          <span>{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeSection === 'summary' && content.summary && (
                <div className="space-y-6">
                  <p className="text-base leading-relaxed">{content.summary.recap}</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Key points
                      </h3>
                      <ul className="space-y-2">
                        {content.summary.key_points?.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Next steps
                      </h3>
                      <ul className="space-y-2">
                        {content.summary.next_steps?.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {onComplete && !isCompleted && (
                    <Button className="w-full" onClick={onComplete}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark lesson complete
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  )
}

