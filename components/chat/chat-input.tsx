'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Paperclip, Mic, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
  placeholder?: string
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder = "Ask Arcana anything...",
  suggestions = [],
  onSuggestionClick,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [value])

  return (
    <div className="space-y-3">
      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          >
            {suggestions.map((suggestion, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-full border border-border/50 transition-all duration-200 hover:scale-105 whitespace-nowrap"
              >
                💡 {suggestion}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <motion.div
        animate={{
          boxShadow: focused
            ? '0 0 0 3px hsl(var(--ring) / 0.3)'
            : '0 0 0 0px transparent',
        }}
        className={cn(
          'relative rounded-2xl border-2 bg-card transition-all duration-300',
          focused
            ? 'border-primary/50 shadow-lg shadow-primary/10'
            : 'border-border/50 hover:border-border'
        )}
      >
        <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2 md:p-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder}
              disabled={loading}
              className={cn(
                'min-h-[40px] md:min-h-[44px] max-h-[120px] resize-none border-0 focus-visible:ring-0',
                'bg-transparent pr-8 md:pr-10 text-sm md:text-base'
              )}
              rows={1}
            />
            
            {/* Character count / Actions */}
            <div className="absolute bottom-1.5 md:bottom-2 right-1.5 md:right-2 flex items-center gap-1 md:gap-2">
              {value.length > 0 && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {value.length}
                </span>
              )}
              <div className="flex gap-1 hidden sm:flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-50 hover:opacity-100"
                  disabled
                  title="Coming soon"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-50 hover:opacity-100"
                  disabled
                  title="Coming soon"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !value.trim()}
            size="icon"
            className={cn(
              'h-10 w-10 md:h-11 md:w-11 rounded-xl shadow-lg transition-all duration-300 flex-shrink-0',
              'bg-gradient-to-br from-primary to-secondary',
              'hover:scale-110 hover:shadow-xl',
              (!value.trim() || loading) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Send className="h-5 w-5" />
              </motion.div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </motion.div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center hidden sm:block">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send,
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs ml-1">Shift + Enter</kbd> for new line
      </p>
    </div>
  )
}

