'use client'

import { Brain } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-5">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Brain className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-center gap-1 bg-muted/60 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
        <span
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: '0.15s' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: '0.3s' }}
        />
      </div>
    </div>
  )
}
