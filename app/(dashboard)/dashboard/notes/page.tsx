'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FileText, Save, Loader2, Calendar, Brain, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Note {
  id: string
  date: string
  content: string
  created_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotes()
  }, [])

  useEffect(() => {
    loadNoteForDate(selectedDate)
  }, [selectedDate])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Failed to fetch notes')
      const data = await response.json()
      setNotes(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load notes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadNoteForDate = async (date: string) => {
    const note = notes.find((n) => n.date === date)
    if (note) {
      setContent(note.content)
    } else {
      setContent('')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const existingNote = notes.find((n) => n.date === selectedDate)

      const url = existingNote
        ? `/api/notes?id=${existingNote.id}`
        : '/api/notes'
      const method = existingNote ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          content,
        }),
      })

      if (!response.ok) throw new Error('Failed to save note')

      const savedNote = await response.json()

      if (existingNote) {
        setNotes(notes.map((n) => (n.id === savedNote.id ? savedNote : n)))
      } else {
        setNotes([...notes, savedNote])
      }

      toast({
        title: 'Saved',
        description: 'Your note has been saved successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save note',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notes & Journal</h1>
        <p className="text-muted-foreground">
          Write daily notes, reflections, and journal entries.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daily Note
          </CardTitle>
          <CardDescription>
            Write your thoughts, reflections, or any notes for today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes here..."
              className="min-h-[400px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !content.trim()}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Note
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!content.trim()) {
                  toast({
                    title: 'No content',
                    description: 'Please write something before summarizing.',
                    variant: 'destructive',
                  })
                  return
                }
                setSummarizing(true)
                try {
                  const response = await fetch('/api/ai/notes/summarize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content }),
                  })
                  if (!response.ok) throw new Error('Failed to summarize')
                  const data = await response.json()
                  setSummary(data)
                  setSummaryDialogOpen(true)
                } catch (error: any) {
                  toast({
                    title: 'Error',
                    description: error.message || 'Failed to summarize note',
                    variant: 'destructive',
                  })
                } finally {
                  setSummarizing(false)
                }
              }}
              disabled={summarizing || !content.trim()}
            >
              {summarizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  AI Summarize
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
            <CardDescription>Your recent journal entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notes
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-lg border cursor-pointer hover:bg-accent"
                    onClick={() => setSelectedDate(note.date)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {new Date(note.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {note.content}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Summary
            </DialogTitle>
            <DialogDescription>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </DialogDescription>
          </DialogHeader>
          {summary && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground">{summary.summary}</p>
              </div>
              {summary.keyPoints && summary.keyPoints.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Key Points</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {summary.keyPoints.map((point: string, idx: number) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.insights && summary.insights.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Insights</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {summary.insights.map((insight: string, idx: number) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.actionItems && summary.actionItems.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Action Items</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {summary.actionItems.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.themes && summary.themes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {summary.themes.map((theme: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded bg-secondary"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {summary.mood && (
                <div>
                  <h3 className="font-semibold mb-2">Mood</h3>
                  <span className="text-sm capitalize px-2 py-1 rounded bg-primary/10">
                    {summary.mood}
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

