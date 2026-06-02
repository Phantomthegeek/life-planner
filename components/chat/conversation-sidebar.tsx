'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Clock, Trash2, MessageSquare, BookOpen, Target, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

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
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Conversations
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onNew} aria-label="New conversation">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No conversations yet. Start one to see it here.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    'w-full text-left p-3 transition-colors relative group',
                    selectedId === conv.id
                      ? 'bg-muted/60 border-l-2 border-foreground'
                      : 'hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                        {getModeIcon(conv.mode)}
                        <p className="font-medium text-sm truncate text-foreground">
                          {conv.title || 'New conversation'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-6">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>{format(new Date(conv.updated_at), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => onDelete(conv.id, e)}
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

