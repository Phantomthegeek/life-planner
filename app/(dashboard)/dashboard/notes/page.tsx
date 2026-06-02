'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, FileText, Search, Calendar, Brain, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useUndo } from '@/hooks/use-undo'
import { ToastAction } from '@/components/ui/toast'
import { formatDateToISO } from '@/lib/utils'

interface Note {
  id: string
  date: string
  content: string
  created_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  const { setUndo, performUndo } = useUndo()
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [noteDate, setNoteDate] = useState(formatDateToISO(new Date()))
  const [summarizingNoteId, setSummarizingNoteId] = useState<string | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [showSummary, setShowSummary] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Failed to fetch notes')
      const data = await response.json()
      setNotes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching notes:', error)
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      toast({
        title: 'Error',
        description: 'Note content is required',
        variant: 'destructive',
      })
      return
    }

    try {
      if (editingNote) {
        const response = await fetch(`/api/notes?id=${editingNote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: noteContent,
            date: noteDate,
          }),
        })

        if (!response.ok) throw new Error('Failed to update note')
        toast({
          title: 'Success',
          description: 'Note updated successfully',
        })
      } else {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: noteContent,
            date: noteDate,
          }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to create note')
        }
        toast({
          title: 'Success',
          description: 'Note created successfully',
        })
      }

      setDialogOpen(false)
      setEditingNote(null)
      setNoteContent('')
      setNoteDate(formatDateToISO(new Date()))
      fetchNotes()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save note',
        variant: 'destructive',
      })
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setNoteContent(note.content)
    setNoteDate(note.date)
    setDialogOpen(true)
  }

  const handleDeleteClick = (noteId: string) => {
    setNoteToDelete(noteId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteNote = async () => {
    if (!noteToDelete) return

    // Store the note data before deletion for undo
    const noteToRestore = notes.find(n => n.id === noteToDelete)
    if (!noteToRestore) return

    try {
      const response = await fetch(`/api/notes?id=${noteToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete note')

      setUndo({
        id: noteToDelete,
        type: 'delete',
        entityType: 'note',
        data: noteToRestore,
        undoFn: async () => {
          const restoreResponse = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: noteToRestore.date,
              content: noteToRestore.content,
            }),
          })
          if (!restoreResponse.ok) throw new Error('Failed to restore note')
          fetchNotes()
        },
      })

      toast({
        title: 'Note deleted',
        description: 'Note deleted successfully',
        action: (
          <ToastAction altText="Undo" onClick={performUndo}>
            Undo
          </ToastAction>
        ),
      })
      setDeleteDialogOpen(false)
      setNoteToDelete(null)
      fetchNotes()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete note',
        variant: 'destructive',
      })
    }
  }

  const handleSummarizeNote = async (note: Note) => {
    setSummarizingNoteId(note.id)
    try {
      const response = await fetch('/api/ai/notes/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_id: note.id,
          content: note.content,
        }),
      })

      if (!response.ok) throw new Error('Failed to summarize note')

      const summaryData = await response.json()
      setSummary(summaryData)
      setShowSummary(note.id)
      toast({
        title: 'Summary Generated',
        description: 'AI has analyzed your note',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to summarize note',
        variant: 'destructive',
      })
    } finally {
      setSummarizingNoteId(null)
    }
  }

  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Notes</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Capture your thoughts, ideas, and daily reflections
        </p>
      </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingNote(null)
            setNoteContent('')
            setNoteDate(formatDateToISO(new Date()))
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit Note' : 'Create New Note'}</DialogTitle>
              <DialogDescription>
                {editingNote ? 'Update your note below' : 'Add a new note to capture your thoughts'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
          <div className="space-y-2">
                <Label htmlFor="note-date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                    id="note-date"
                type="date"
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
                <Label htmlFor="note-content">Content</Label>
            <Textarea
                  id="note-content"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your note here..."
                  className="min-h-[200px]"
            />
          </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
            </Button>
                <Button onClick={handleSaveNote}>Save Note</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
                </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="h-48 hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleEditNote(note)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(note.date).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 h-full flex flex-col">
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-6 flex-1">
                  {note.content}
                </p>
                {showSummary === note.id && summary && (
                  <div className="mt-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">AI Summary</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{summary.summary}</p>
                    {summary.keyPoints && summary.keyPoints.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold mb-1">Key Points:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-0.5">
                          {summary.keyPoints.slice(0, 3).map((point: string, idx: number) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {summary.actionItems && summary.actionItems.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold mb-1">Action Items:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-0.5">
                          {summary.actionItems.slice(0, 2).map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSummarizeNote(note)
                    }}
                    disabled={summarizingNoteId === note.id}
                  >
                    {summarizingNoteId === note.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Brain className="h-3 w-3" />
                    )}
                    {summarizingNoteId === note.id ? 'Summarizing...' : 'AI Summarize'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditNote(note)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(note.id)
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notes found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search or filters' : 'Create your first note to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Note
            </Button>
          )}
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
