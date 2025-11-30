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
  Trophy,
  AlertCircle,
  Lightbulb
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
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="border-2 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Trophy className="h-16 w-16 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-green-50 text-lg">You scored</p>
          </div>

          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white text-4xl font-bold mb-4">
                {score}%
              </div>
              <p className="text-2xl font-semibold mb-2">
                {correctCount} out of {questions.length} correct
              </p>
              {score >= 80 ? (
                <Badge className="bg-green-500 hover:bg-green-600 gap-2 px-4 py-2">
                  <Trophy className="h-4 w-4" />
                  Excellent Work!
                </Badge>
              ) : score >= 60 ? (
                <Badge className="bg-blue-500 hover:bg-blue-600 gap-2 px-4 py-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Good Job!
                </Badge>
              ) : (
                <Badge className="bg-orange-500 hover:bg-orange-600 gap-2 px-4 py-2">
                  <AlertCircle className="h-4 w-4" />
                  Keep Practicing!
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold mb-3">Review Your Answers</h3>
              {questions.map((question, idx) => {
                const answer = answers.find(a => a.questionId === question.id)
                const isCorrect = answer?.correct

                return (
                  <Card
                    key={question.id}
                    className={cn(
                      'transition-all',
                      isCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'border-red-500 bg-red-50 dark:bg-red-950'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium mb-1">
                            Question {idx + 1}: {question.question}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Your answer: <span className="font-medium">{answer?.answer}</span>
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                              Correct: {question.correct_answer}
                            </p>
                          )}
                          {question.explanation && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
                              <div className="flex items-start gap-2">
                                <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-foreground">{question.explanation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
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

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 shadow-xl premium-card">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">
                  {currentQuestion.question_type.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  Level {currentQuestion.difficulty_level}/5
                </Badge>
              </div>
              <CardTitle className="text-2xl leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Answer Options */}
              {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedAnswer === option
                    const isCorrect = option === currentQuestion.correct_answer
                    const showFeedback = showResult && isSelected

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleAnswer(option)}
                        disabled={showResult}
                        className={cn(
                          'w-full text-left p-4 rounded-lg border-2 transition-all duration-300',
                          'hover:shadow-md',
                          showResult && 'cursor-not-allowed',
                          showFeedback && isCorrect && 'bg-green-500 border-green-600 text-white',
                          showFeedback && !isCorrect && 'bg-red-500 border-red-600 text-white',
                          !showResult && isSelected && 'bg-primary/10 border-primary',
                          !showResult && 'hover:bg-muted border-border'
                        )}
                        whileHover={!showResult ? { scale: 1.02 } : {}}
                        whileTap={!showResult ? { scale: 0.98 } : {}}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option}</span>
                          {showFeedback && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              {isCorrect ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <XCircle className="h-5 w-5" />
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* True/False */}
              {currentQuestion.question_type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map((option) => {
                    const isSelected = selectedAnswer === option
                    const isCorrect = option === currentQuestion.correct_answer
                    const showFeedback = showResult && isSelected

                    return (
                      <motion.button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        disabled={showResult}
                        className={cn(
                          'p-6 rounded-lg border-2 font-semibold text-lg transition-all duration-300',
                          showFeedback && isCorrect && 'bg-green-500 border-green-600 text-white',
                          showFeedback && !isCorrect && 'bg-red-500 border-red-600 text-white',
                          !showResult && isSelected && 'bg-primary/10 border-primary',
                          !showResult && 'hover:bg-muted border-border'
                        )}
                        whileHover={!showResult ? { scale: 1.05 } : {}}
                        whileTap={!showResult ? { scale: 0.95 } : {}}
                      >
                        {option}
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* Explanation */}
              {showResult && currentQuestion.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Explanation
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0 || !showResult}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!showResult}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  {isLastQuestion ? 'Complete Quiz' : 'Next Question'}
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

