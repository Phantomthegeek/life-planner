'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FlipHorizontal } from 'lucide-react'

interface FlashcardProps {
  front: string
  back: string
  category?: string
}

export function InlineFlashcard({ front, back, category }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <Card className="my-4 cursor-pointer" onClick={() => setFlipped(!flipped)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          {category && (
            <span className="text-xs text-muted-foreground">{category}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setFlipped(!flipped)
            }}
          >
            <FlipHorizontal className="h-4 w-4 mr-2" />
            Flip
          </Button>
        </div>
        <div className="min-h-[120px] flex items-center justify-center">
          <p className="text-lg text-center">
            {flipped ? back : front}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

