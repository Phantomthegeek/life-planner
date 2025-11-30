'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FlipHorizontal, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  TrendingUp,
  Shuffle
} from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Flashcard {
  id: string
  front: string
  back: string
  category?: string
  difficulty_level: number
}

interface FlashcardSystemProps {
  flashcards: Flashcard[]
  onDifficultyRate?: (flashcardId: string, difficulty: number) => void
}

export function FlashcardSystem({ flashcards, onDifficultyRate }: FlashcardSystemProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shuffled, setShuffled] = useState(false)
  const [studyCards, setStudyCards] = useState<Flashcard[]>(flashcards)
  const [studied, setStudied] = useState<Set<string>>(new Set())
  const [difficulties, setDifficulties] = useState<Map<string, number>>(new Map())

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  useEffect(() => {
    setStudyCards(flashcards)
  }, [flashcards])

  const currentCard = studyCards[currentIndex]
  const progress = studyCards.length > 0 ? ((studied.size / studyCards.length) * 100) : 0

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      // Easy - move to next
      nextCard()
    } else {
      // Hard - will be repeated
      nextCard()
    }
  }

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100
    if (Math.abs(info.offset.x) > threshold) {
      handleSwipe(info.offset.x > 0 ? 'right' : 'left')
      x.set(0)
    } else {
      x.set(0)
    }
  }

  const nextCard = () => {
    setStudied(prev => new Set([...prev, currentCard.id]))
    setFlipped(false)
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const prevCard = () => {
    setFlipped(false)
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const shuffleCards = () => {
    const shuffled = [...studyCards].sort(() => Math.random() - 0.5)
    setStudyCards(shuffled)
    setCurrentIndex(0)
    setStudied(new Set())
    setShuffled(true)
  }

  const reset = () => {
    setCurrentIndex(0)
    setStudied(new Set())
    setFlipped(false)
    setStudyCards(flashcards)
    setShuffled(false)
  }

  const rateDifficulty = (difficulty: number) => {
    if (currentCard && onDifficultyRate) {
      onDifficultyRate(currentCard.id, difficulty)
    }
    setDifficulties(prev => new Map(prev.set(currentCard.id, difficulty)))
    nextCard()
  }

  if (!currentCard) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="p-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">All Done! 🎉</h3>
        <p className="text-muted-foreground mb-6">
          You&apos;ve studied all {flashcards.length} flashcards
        </p>
        <Button onClick={reset} size="lg">
          <RotateCcw className="mr-2 h-4 w-4" />
          Study Again
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Card {currentIndex + 1} of {studyCards.length}
          </span>
          <span className="font-medium">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div className="relative h-[400px] perspective-1000">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ x, rotate, opacity }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="w-full h-full"
          >
            {/* Front */}
            <Card
              className={cn(
                'absolute inset-0 w-full h-full cursor-pointer border-2 shadow-2xl premium-card',
                'backface-hidden',
                !flipped && 'z-10'
              )}
              onClick={() => setFlipped(!flipped)}
              style={{ transform: 'rotateY(0deg)', transformStyle: 'preserve-3d' }}
            >
              <CardContent className="h-full flex flex-col items-center justify-center p-8">
                <div className="text-center space-y-4 w-full">
                  {currentCard.category && (
                    <Badge variant="outline" className="mb-4">
                      {currentCard.category}
                    </Badge>
                  )}
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {currentCard.front}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-6">
                    Click or swipe to flip
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Back */}
            <Card
              className={cn(
                'absolute inset-0 w-full h-full cursor-pointer border-2 shadow-2xl premium-card',
                'backface-hidden',
                flipped && 'z-10',
                'bg-gradient-to-br from-primary/10 to-secondary/10'
              )}
              onClick={() => setFlipped(!flipped)}
              style={{ transform: 'rotateY(180deg)', transformStyle: 'preserve-3d' }}
            >
              <CardContent className="h-full flex flex-col items-center justify-center p-8">
                <div className="text-center space-y-6 w-full">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                    <FlipHorizontal className="h-4 w-4" />
                    <span className="text-sm">Answer</span>
                  </div>
                  <p className="text-2xl leading-relaxed">{currentCard.back}</p>
                  
                  {difficulties.has(currentCard.id) && (
                    <Badge variant="outline" className="mt-4">
                      Difficulty: {difficulties.get(currentCard.id)}/5
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevCard}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFlipped(!flipped)}
              className="rounded-full"
            >
              <FlipHorizontal className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={shuffleCards}
              className="rounded-full"
              title="Shuffle"
            >
              <Shuffle className="h-5 w-5" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={nextCard}
            disabled={currentIndex === studyCards.length - 1}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Difficulty Rating (when flipped) */}
        {flipped && onDifficultyRate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted/50 rounded-lg p-4"
          >
            <p className="text-sm font-medium mb-3 text-center">
              How difficult was this card?
            </p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <Button
                  key={level}
                  variant="outline"
                  size="sm"
                  onClick={() => rateDifficulty(level)}
                  className={cn(
                    'w-12 h-12 rounded-full',
                    difficulties.get(currentCard.id) === level && 'bg-primary text-primary-foreground'
                  )}
                >
                  {level}
                </Button>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Rating affects when this card appears again
            </p>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSwipe('left')}
            className="bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-500/20"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Easy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSwipe('right')}
            className="bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Hard
          </Button>
        </div>
      </div>

      {/* Stats */}
      {studied.size > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Studied</span>
              <span className="font-semibold">
                {studied.size} / {studyCards.length}
              </span>
            </div>
            <Progress value={(studied.size / studyCards.length) * 100} className="h-1 mt-2" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

