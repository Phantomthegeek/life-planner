'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Brain, Save, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from '@/components/chat/message-bubble'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import { ConversationSidebar } from '@/components/chat/conversation-sidebar'
import { ChatInput } from '@/components/chat/chat-input'
import { ChatEmptyState } from '@/components/chat/empty-state'
import { MobileChatToggle } from '@/components/chat/mobile-chat-toggle'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  mode?: string
  timestamp: string
  inline_tools?: Array<{
    type: 'flashcard' | 'quiz' | 'diagram' | 'table'
    data: any
  }>
}

interface ChatConversation {
  id: string
  title: string | null
  mode: string
  updated_at: string
  created_at: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [currentMode, setCurrentMode] = useState<string>('chat')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [])

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId)
    } else {
      setMessages([])
      setCurrentMode('chat')
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const fetchConversations = async () => {
    setLoadingConversations(true)
    try {
      const response = await fetch('/api/chat')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoadingConversations(false)
    }
  }

  const fetchMessages = async (convId: string) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/chat?conversation_id=${convId}`)
      if (response.ok) {
        const data = await response.json()
        const formattedMessages: ChatMessage[] = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          mode: msg.mode,
          timestamp: msg.created_at,
          inline_tools: msg.metadata?.inline_tools || [],
        }))
        setMessages(formattedMessages)
        if (formattedMessages.length > 0) {
          const lastMessage = formattedMessages[formattedMessages.length - 1]
          if (lastMessage.mode) {
            setCurrentMode(lastMessage.mode)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: 'Error',
        description: 'Failed to load conversation',
        variant: 'destructive',
      })
    } finally {
      setLoadingMessages(false)
    }
  }

  const startNewConversation = () => {
    setConversationId(null)
    setMessages([])
    setCurrentMode('chat')
    setSuggestions([])
    setInput('')
  }

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/chat/${convId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setConversations(conversations.filter(c => c.id !== convId))
        if (conversationId === convId) {
          startNewConversation()
        }
        toast({
          title: 'Success',
          description: 'Conversation deleted',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive',
      })
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message to UI immediately
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }
    
    setMessages((prev) => [...prev, newUserMessage])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Update conversation ID if new
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id)
        fetchConversations()
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        mode: data.mode,
        timestamp: new Date().toISOString(),
        inline_tools: data.inline_tools,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setCurrentMode(data.mode || 'chat')
      setSuggestions(data.suggestions || [])

      if (data.should_save_to_notes) {
        toast({
          title: '💡 Tip',
          description: 'This conversation can be saved to your notes!',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      })
      setMessages((prev) => prev.filter(m => m.id !== newUserMessage.id))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToNotes = async () => {
    if (!conversationId) return

    try {
      const response = await fetch('/api/chat/save-to-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          title: `Chat with Arcana - ${new Date().toLocaleDateString()}`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      toast({
        title: 'Success!',
        description: 'Chat saved to notes',
      })

      setSaveDialogOpen(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save chat',
        variant: 'destructive',
      })
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'learning':
        return 'bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-400'
      case 'task':
        return 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400'
      case 'chat':
        return 'bg-purple-500/10 border-purple-500/50 text-purple-700 dark:text-purple-400'
      default:
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-400'
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)] gap-2 md:gap-4 max-w-7xl mx-auto relative px-2 md:px-4">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 z-50 md:relative md:z-auto md:w-80 md:flex-shrink-0"
            >
              <ConversationSidebar
                conversations={conversations}
                selectedId={conversationId}
                onSelect={(id) => {
                  setConversationId(id)
                  setSidebarOpen(false) // Close on mobile after selection
                }}
                onNew={() => {
                  startNewConversation()
                  setSidebarOpen(false) // Close on mobile after new
                }}
                onDelete={deleteConversation}
                loading={loadingConversations}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar - Chat History (Desktop) */}
      <div className="hidden md:block w-80 flex-shrink-0">
        <ConversationSidebar
          conversations={conversations}
          selectedId={conversationId}
          onSelect={setConversationId}
          onNew={startNewConversation}
          onDelete={deleteConversation}
          loading={loadingConversations}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 mb-4 md:mb-6"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <MobileChatToggle
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden"
              />
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="hidden sm:block p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg flex-shrink-0"
              >
                <Brain className="h-6 w-6 md:h-10 md:w-10 text-primary" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight gradient-text truncate">
                  Chat with Arcana
                </h1>
                <p className="text-muted-foreground text-sm md:text-lg hidden sm:block">
                  Your AI learning mentor and assistant ✨
                </p>
              </div>
            </div>
            {conversationId && messages.length > 0 && (
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="shimmer-button hidden sm:inline-flex">
                    <Save className="mr-2 h-4 w-4" />
                    <span className="hidden md:inline">Save to Notes</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Chat to Notes</DialogTitle>
                    <DialogDescription>
                      Save this conversation to your notes for later reference.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Button onClick={handleSaveToNotes} className="w-full">
                      Save Conversation
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </motion.div>

        {/* Chat Messages */}
        <Card className="flex-1 flex flex-col overflow-hidden mb-2 md:mb-4 glow-card border-2">
          <CardHeader className="pb-2 md:pb-3 border-b bg-muted/30 px-3 md:px-6">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base md:text-lg font-bold">Conversation</CardTitle>
              {currentMode && (
                <Badge variant="outline" className={cn(getModeColor(currentMode), "text-xs")}>
                  <Sparkles className="mr-1 md:mr-2 h-3 w-3" />
                  <span className="capitalize hidden sm:inline">{currentMode} Mode</span>
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0 relative">
            <ScrollArea className="h-full">
              <div className="p-3 md:p-6 min-h-full">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="text-center space-y-4">
                      <div className="inline-block p-4 rounded-full bg-primary/10">
                        <Brain className="h-8 w-8 text-primary animate-pulse" />
                      </div>
                      <p className="text-muted-foreground">Loading conversation...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <ChatEmptyState onPromptClick={(prompt) => setInput(prompt)} />
                ) : (
                  <div className="space-y-1">
                    {messages.map((message, index) => (
                      <MessageBubble
                        key={message.id}
                        id={message.id}
                        role={message.role}
                        content={message.content}
                        timestamp={message.timestamp}
                        inlineTools={message.inline_tools}
                        isStreaming={index === messages.length - 1 && loading}
                      />
                    ))}
                    {loading && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Input */}
        <Card className="glow-card border-2">
          <CardContent className="p-2 md:p-4">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              loading={loading}
              placeholder="Ask Arcana anything... (Learning, tasks, or just chat!)"
              suggestions={suggestions}
              onSuggestionClick={(suggestion) => setInput(suggestion)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
