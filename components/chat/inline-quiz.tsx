'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizOption {
  text: string
  isCorrect: boolean
}

interface InlineQuizProps {
  question: string
  options: QuizOption[]
  explanation?: string
}

export function InlineQuiz({ question, options, explanation }: InlineQuizProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleSelect = (index: number) => {
    if (showResult) return
    setSelectedIndex(index)
    setShowResult(true)
  }

  const isCorrect = selectedIndex !== null && options[selectedIndex]?.isCorrect

  return (
    <Card className="my-4 border-2">
      <CardHeader>
        <CardTitle className="text-lg">{question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index
          const showAsCorrect = showResult && option.isCorrect
          const showAsIncorrect = showResult && isSelected && !option.isCorrect

          return (
            <Button
              key={index}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'w-full justify-start text-left h-auto py-3',
                showAsCorrect && 'bg-green-500 hover:bg-green-600',
                showAsIncorrect && 'bg-red-500 hover:bg-red-600'
              )}
              onClick={() => handleSelect(index)}
              disabled={showResult}
            >
              <div className="flex items-center gap-3 w-full">
                {showResult && (
                  <>
                    {showAsCorrect && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
                    {showAsIncorrect && <XCircle className="h-5 w-5 flex-shrink-0" />}
                  </>
                )}
                <span className="flex-1">{option.text}</span>
              </div>
            </Button>
          )
        })}

        {showResult && explanation && (
          <div className={cn(
            'mt-4 p-4 rounded-lg',
            isCorrect ? 'bg-green-500/10 border border-green-500/50' : 'bg-blue-500/10 border border-blue-500/50'
          )}>
            <p className="text-sm">
              <strong>{isCorrect ? 'Correct! ' : 'Incorrect. '}</strong>
              {explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

