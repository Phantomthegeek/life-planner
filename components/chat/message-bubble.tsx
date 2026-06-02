'use client'

import { format } from 'date-fns'
import { Brain, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InlineToolsRenderer } from './inline-tools-renderer'

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
    <div
      className={cn(
        'flex gap-3 mb-5 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div className="flex-shrink-0">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center border',
            isUser
              ? 'bg-foreground text-background border-transparent'
              : 'bg-muted text-foreground'
          )}
        >
          {isUser ? (
            <UserIcon className="h-4 w-4" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
        </div>
      </div>

      <div
        className={cn(
          'flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5',
            isUser
              ? 'bg-foreground text-background rounded-br-sm'
              : 'bg-muted/60 text-foreground rounded-bl-sm'
          )}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
            {content}
            {isStreaming && (
              // Subtle cursor while the model is still typing.
              <span className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-current animate-pulse" />
            )}
          </p>

          {!isUser && inlineTools && inlineTools.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <InlineToolsRenderer tools={inlineTools} messageId={id} />
            </div>
          )}
        </div>

        <span className="text-xs text-muted-foreground px-1">
          {format(new Date(timestamp), 'h:mm a')}
        </span>
      </div>
    </div>
  )
}
