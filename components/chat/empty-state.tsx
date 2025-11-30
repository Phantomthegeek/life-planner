'use client'

import { Card } from '@/components/ui/card'
import { BookOpen, Target, MessageSquare, Sparkles, Brain, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const quickStarts = [
  {
    icon: BookOpen,
    title: 'Learning Mode',
    description: '"Explain Module 2"',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    hoverColor: 'hover:bg-blue-500/20',
    mode: 'learning',
  },
  {
    icon: Target,
    title: 'Task Mode',
    description: '"Create a task for..."',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    hoverColor: 'hover:bg-green-500/20',
    mode: 'task',
  },
  {
    icon: MessageSquare,
    title: 'Chat Mode',
    description: '"Tell me something cool"',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    hoverColor: 'hover:bg-purple-500/20',
    mode: 'chat',
  },
]

const examplePrompts = [
  "What's the best way to study AWS Cloud Practitioner?",
  "Create a study plan for JavaScript certification",
  "Explain React hooks in simple terms",
  "Help me break down my goals into tasks",
  "What should I focus on today?",
]

interface EmptyStateProps {
  onPromptClick?: (prompt: string) => void
}

export function ChatEmptyState({ onPromptClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8">
      {/* Animated Brain Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
          <Brain className="h-16 w-16 text-primary" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <h3 className="text-3xl font-bold gradient-text">Start chatting with Einstein!</h3>
        <p className="text-muted-foreground text-lg max-w-md">
          I can help you learn, plan tasks, brainstorm ideas, or just chat about anything!
        </p>
      </motion.div>

      {/* Quick Start Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl"
      >
        {quickStarts.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.mode}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                className={cn(
                  'p-6 text-center cursor-pointer transition-all duration-300',
                  'hover:shadow-xl border-2 hover-lift',
                  item.bgColor,
                  item.hoverColor
                )}
                onClick={() => onPromptClick?.(item.description.replace(/"/g, ''))}
              >
                <div className={cn('w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center', item.bgColor)}>
                  <Icon className={cn('h-6 w-6', item.color)} />
                </div>
                <p className="font-semibold mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Example Prompts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="w-full max-w-2xl space-y-3"
      >
        <p className="text-sm font-medium text-muted-foreground">Or try one of these:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {examplePrompts.map((prompt, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.02, x: 5 }}
              onClick={() => onPromptClick?.(prompt)}
              className="text-left p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 transition-all duration-200 text-sm"
            >
              <Sparkles className="h-4 w-4 inline mr-2 text-primary" />
              {prompt}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

