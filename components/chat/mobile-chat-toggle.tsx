'use client'

import { Button } from '@/components/ui/button'
import { MessageSquare, X, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileChatToggleProps {
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export function MobileChatToggle({ isOpen, onToggle, className }: MobileChatToggleProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className={cn('md:hidden', className)}
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <MessageSquare className="h-5 w-5" />
      )}
    </Button>
  )
}

