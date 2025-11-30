'use client'

import { format } from 'date-fns'
import { Brain, User as UserIcon, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InlineToolsRenderer } from './inline-tools-renderer'
import { motion } from 'framer-motion'

interface MessageBubbleProps {
  id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  inlineTools?: Array<{
    type: 'flashcard' | 'quiz' | 'diagram' | 'table'
    data: any
  }>
  isStreaming?: boolean
}

export function MessageBubble({
  id,
  role,
  content,
  timestamp,
  inlineTools,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex gap-2 md:gap-3 mb-4 md:mb-6 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg ring-2 ring-primary/20">
            <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg ring-2 ring-blue-500/20 animate-pulse-slow">
            <Brain className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
        {/* Bubble */}
        <div
          className={cn(
            'relative rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-lg transition-all duration-300',
            isUser
              ? 'bg-gradient-to-br from-primary to-primary/90 text-white rounded-br-sm md:rounded-br-md'
              : 'bg-card border border-border/50 rounded-bl-sm md:rounded-bl-md hover:shadow-xl'
          )}
        >
          {/* Content */}
          <div>
            <p className={cn(
              'whitespace-pre-wrap break-words leading-relaxed',
              isUser ? 'text-white' : 'text-foreground'
            )}>
              {content}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
              )}
            </p>
          </div>

          {/* Inline Tools */}
          {!isUser && inlineTools && inlineTools.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <InlineToolsRenderer tools={inlineTools} messageId={id} />
            </div>
          )}

          {/* Tail */}
          <div
            className={cn(
              'absolute top-0 w-3 h-3',
              isUser
                ? 'right-0 translate-x-1 -translate-y-1 bg-primary rotate-45'
                : 'left-0 -translate-x-1 -translate-y-1 bg-card border-l border-b border-border/50 rotate-45'
            )}
          />
        </div>

        {/* Timestamp & Status */}
        <div className={cn(
          'flex items-center gap-2 text-xs text-muted-foreground px-2',
          isUser && 'flex-row-reverse'
        )}>
          {isUser && <CheckCheck className="h-3 w-3 text-primary" />}
          <span>{format(new Date(timestamp), 'h:mm a')}</span>
        </div>
      </div>
    </motion.div>
  )
}

