'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface QuizQuestion {
  id: string
  question: string
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank'
  options?: string[]
  correct_answer: string
  explanation: string
  difficulty_level: number
}

interface QuizInterfaceProps {
  questions: QuizQuestion[]
  quizTitle: string
  onComplete?: (score: number, answers: any[]) => void
}

export function QuizInterface({ questions, quizTitle, onComplete }: QuizInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [answers, setAnswers] = useState<Array<{
    questionId: string
    answer: string
    correct: boolean
    timeSpent: number
  }>>([])
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [completed, setCompleted] = useState(false)

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const correctCount = answers.filter(a => a.correct).length
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

  useEffect(() => {
    setStartTime(Date.now())
  }, [currentIndex])

  const handleAnswer = (answer: string) => {
    if (showResult) return

    setSelectedAnswer(answer)
    setShowResult(true)

    const isCorrect = answer === currentQuestion.correct_answer
    const timeSpent = Math.round((Date.now() - startTime) / 1000)

    setAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      answer,
      correct: isCorrect,
      timeSpent,
    }])
  }

  const handleNext = () => {
    if (isLastQuestion) {
      handleComplete()
      return
    }

    setCurrentIndex(prev => prev + 1)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  const handleComplete = () => {
    setCompleted(true)
    if (onComplete) {
      onComplete(score, answers)
    }
  }

  if (completed) {
    // Three buckets: passed (80+), borderline (60–79), needs review (<60).
    const verdict =
      score >= 80
        ? { label: 'Solid pass', tone: 'text-green-600 dark:text-green-400' }
        : score >= 60
          ? { label: 'You got most of it', tone: 'text-blue-600 dark:text-blue-400' }
          : { label: 'Worth another pass', tone: 'text-orange-600 dark:text-orange-400' }

    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="text-center space-y-2">
              <p className="text-sm uppercase tracking-wide text-muted-foreground">
                {quizTitle}
              </p>
              <p className="text-5xl font-semibold tabular-nums">{score}%</p>
              <p className="text-sm text-muted-foreground">
                {correctCount} of {questions.length} correct
              </p>
              <p className={cn('text-sm font-medium', verdict.tone)}>{verdict.label}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Review
              </h3>
              {questions.map((question, idx) => {
                const answer = answers.find(a => a.questionId === question.id)
                const isCorrect = answer?.correct

                return (
                  <div
                    key={question.id}
                    className={cn(
                      'border-l-2 pl-4 py-2',
                      isCorrect ? 'border-green-500' : 'border-red-500'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {idx + 1}. {question.question}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          You answered{' '}
                          <span className="font-medium text-foreground">{answer?.answer}</span>
                          {!isCorrect && (
                            <>
                              {' '}— correct was{' '}
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {question.correct_answer}
                              </span>
                            </>
                          )}
                        </p>
                        {question.explanation && (
                          <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                            <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="font-medium">
            {Math.round(((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100)}% Complete
          </span>
        </div>
        <Progress value={((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                <span className="uppercase tracking-wide">
                  {currentQuestion.question_type.replace('_', ' ')}
                </span>
                <span aria-hidden>·</span>
                <span>Level {currentQuestion.difficulty_level}/5</span>
              </div>
              <CardTitle className="text-base md:text-xl leading-relaxed font-semibold break-words">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                <div className="space-y-2">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedAnswer === option
                    const isCorrect = option === currentQuestion.correct_answer
                    const showFeedback = showResult && isSelected

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(option)}
                        disabled={showResult}
                        className={cn(
                          'w-full text-left p-3 rounded-md border transition-colors',
                          showResult && 'cursor-not-allowed',
                          showFeedback && isCorrect && 'border-green-500 bg-green-500/10',
                          showFeedback && !isCorrect && 'border-red-500 bg-red-500/10',
                          !showResult && isSelected && 'border-primary bg-primary/5',
                          !showResult && !isSelected && 'border-border hover:border-foreground/30 hover:bg-muted/40'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{option}</span>
                          {showFeedback &&
                            (isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {currentQuestion.question_type === 'true_false' && (
                <div className="grid grid-cols-2 gap-3">
                  {['True', 'False'].map((option) => {
                    const isSelected = selectedAnswer === option
                    const isCorrect = option === currentQuestion.correct_answer
                    const showFeedback = showResult && isSelected

                    return (
                      <button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        disabled={showResult}
                        className={cn(
                          'p-4 rounded-md border font-medium transition-colors',
                          showFeedback && isCorrect && 'border-green-500 bg-green-500/10',
                          showFeedback && !isCorrect && 'border-red-500 bg-red-500/10',
                          !showResult && isSelected && 'border-primary bg-primary/5',
                          !showResult && !isSelected && 'border-border hover:border-foreground/30 hover:bg-muted/40'
                        )}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              )}

              {showResult && currentQuestion.explanation && (
                <div className="p-3 bg-muted/40 rounded-md border-l-2 border-blue-500">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{currentQuestion.explanation}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0 || !showResult}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <Button onClick={handleNext} disabled={!showResult}>
                  {isLastQuestion ? 'Finish' : 'Next'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

