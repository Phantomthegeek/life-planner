'use client'

import { Card } from '@/components/ui/card'
import { BookOpen, Target, MessageSquare } from 'lucide-react'

const quickStarts = [
  {
    icon: BookOpen,
    title: 'Learn something',
    example: 'Explain how Kubernetes pods work',
  },
  {
    icon: Target,
    title: 'Plan a task',
    example: 'Break "ship landing page" into steps',
  },
  {
    icon: MessageSquare,
    title: 'Just talk',
    example: 'What should I focus on this week?',
  },
]

const examplePrompts = [
  'Best way to study for AWS Cloud Practitioner?',
  'Create a study plan for the next two weeks',
  'Explain React hooks in plain English',
  'Help me break down my goals into tasks',
  'What should I focus on today?',
]

interface EmptyStateProps {
  onPromptClick?: (prompt: string) => void
}

export function ChatEmptyState({ onPromptClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12 space-y-8">
      <div>
        <h3 className="text-2xl font-semibold tracking-tight mb-2">
          What can I help with?
        </h3>
        <p className="text-muted-foreground">
          Ask anything. Arcana figures out whether you want to learn, plan, or chat.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        {quickStarts.map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.title}
              role="button"
              tabIndex={0}
              onClick={() => onPromptClick?.(item.example)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onPromptClick?.(item.example)
              }}
              className="p-4 text-left cursor-pointer hover:border-foreground/20 transition-colors"
            >
              <Icon className="h-4 w-4 mb-2 text-muted-foreground" />
              <p className="font-medium text-sm mb-1">{item.title}</p>
              <p className="text-xs text-muted-foreground italic">{item.example}</p>
            </Card>
          )
        })}
      </div>

      <div className="w-full space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          Or try
        </p>
        <div className="flex flex-col gap-1">
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onPromptClick?.(prompt)}
              className="text-left text-sm text-muted-foreground hover:text-foreground py-1.5 transition-colors"
            >
              <span className="opacity-50 mr-2">›</span>
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
