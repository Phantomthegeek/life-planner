'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Clock, Trash2, MessageSquare, BookOpen, Target, Sparkles, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface Conversation {
  id: string
  title: string | null
  mode: string
  updated_at: string
  created_at: string
}

interface ConversationSidebarProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string, e: React.MouseEvent) => void
  loading: boolean
}

export function ConversationSidebar({
  conversations,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  loading,
}: ConversationSidebarProps) {
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'learning':
        return <BookOpen className="h-4 w-4" />
      case 'task':
        return <Target className="h-4 w-4" />
      case 'chat':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'learning':
        return 'text-blue-500'
      case 'task':
        return 'text-green-500'
      case 'chat':
        return 'text-purple-500'
      default:
        return 'text-yellow-500'
    }
  }

  return (
    <Card className="h-full flex flex-col glow-card">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold gradient-text">Conversations</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onNew}
            className="shimmer-button"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium mb-1">No conversations yet</p>
              <p className="text-xs text-muted-foreground">
                Start a new chat to begin!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {conversations.map((conv, index) => (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    'w-full text-left p-4 transition-all duration-200 relative group',
                    selectedId === conv.id
                      ? 'bg-primary/10 border-l-4 border-primary'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn('flex-shrink-0', getModeColor(conv.mode))}>
                          {getModeIcon(conv.mode)}
                        </div>
                        <p className="font-semibold text-sm truncate">
                          {conv.title || 'New Conversation'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>{format(new Date(conv.updated_at), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                        'hover:bg-destructive/10 hover:text-destructive'
                      )}
                      onClick={(e) => onDelete(conv.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

