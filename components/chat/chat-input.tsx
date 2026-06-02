'use client'

import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
  placeholder?: string
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
}

// We auto-grow the textarea up to 120px, then let it scroll. Keeps the input
// from eating the whole screen when someone pastes a wall of text.
const MAX_TEXTAREA_HEIGHT = 120

export function ChatInput({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder = 'Ask Arcana anything…',
  suggestions = [],
  onSuggestionClick,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loading && value.trim()) {
      onSubmit()
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline. Mirrors GitHub/Slack/Notion.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        MAX_TEXTAREA_HEIGHT
      )}px`
    }
  }, [value])

  return (
    <div className="space-y-3">
      {suggestions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick?.(suggestion)}
              className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/70 rounded-full border border-border transition-colors whitespace-nowrap"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn(
          'flex items-end gap-2 rounded-lg border bg-card p-2',
          'focus-within:border-foreground/30 transition-colors'
        )}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          className="min-h-[40px] max-h-[120px] resize-none border-0 focus-visible:ring-0 bg-transparent text-sm shadow-none px-2"
          rows={1}
        />

        <Button
          type="submit"
          disabled={loading || !value.trim()}
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          aria-label="Send"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
