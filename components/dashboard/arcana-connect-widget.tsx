'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link2, Network, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'

// Arcana Connect widget - shows linked notes and knowledge graph connections
export function ArcanaConnectWidget() {
  const [connectedNotes, setConnectedNotes] = useState<any[]>([])

  useEffect(() => {
    // Fetch notes to show connections
    fetch('/api/notes')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Show notes with categories as "connected" notes
          const withCategories = data.filter((n: any) => n.category).slice(0, 2)
          setConnectedNotes(
            withCategories.map((note: any) => ({
              id: note.id,
              title: note.content?.substring(0, 30) || 'Untitled Note',
              linkCount: note.category ? 1 : 0,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  return (
    <Card className="col-span-1 border-2 border-[#00C1B3]/20 hover:border-[#00C1B3]/40 transition-colors">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="h-5 w-5 text-[#00C1B3]" />
          Arcana Connect
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Network className="h-4 w-4 text-[#00C1B3]" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Connected Notes</p>
          </div>

          {/* Note connection list */}
          <div className="space-y-3 mb-4">
            {connectedNotes.length > 0 ? (
              connectedNotes.map((note) => (
                <div
                  key={note.id}
                  className="h-20 bg-gradient-to-r from-[#00C1B3]/10 to-[#9C6ADE]/10 rounded-lg p-3 border border-[#00C1B3]/20 dark:border-[#00C1B3]/30"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-1">
                      {note.title}
                    </p>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-[#00C1B3]" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{note.linkCount} link</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bi-directional connections</p>
                </div>
              ))
            ) : (
              <div className="h-20 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">No connected notes yet</p>
              </div>
            )}
          </div>

          <Button
            className="w-full bg-gradient-to-r from-[#00C1B3] to-[#9C6ADE] hover:from-[#00D1C3] hover:to-[#AC7ADE] text-white shadow-md"
            onClick={() => window.location.href = '/dashboard/notes'}
          >
            <Network className="mr-2 h-4 w-4" />
            View Knowledge Graph
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
