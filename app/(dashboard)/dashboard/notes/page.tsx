'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Note {
  id: string
  date: string
  content: string
  created_at: string
  category?: string
}

const filterOptions = ['All Notes', 'Personal', 'Work', 'Ideas', 'Projects', 'Research']

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedFilter, setSelectedFilter] = useState('All Notes')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Failed to fetch notes')
      const data = await response.json()
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotes =
    selectedFilter === 'All Notes'
      ? notes
      : notes.filter((note) => note.category?.toLowerCase() === selectedFilter.toLowerCase())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {filterOptions.map((filter) => (
          <Button
            key={filter}
            variant={selectedFilter === filter ? 'default' : 'outline'}
            className={cn(
              selectedFilter === filter
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            )}
            onClick={() => setSelectedFilter(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-48 bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="h-48 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 h-full flex flex-col">
                <div className="text-xs text-gray-500 mb-2">
                  {new Date(note.date).toLocaleDateString()}
                </div>
                <p className="text-sm text-gray-700 line-clamp-6 flex-1">
                  {note.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-48 bg-gray-50 border-2 border-dashed border-gray-200" />
          ))}
        </div>
      )}
    </div>
  )
}
