'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Tags, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'

// AI Auto Tag widget - shows recent notes with AI tags
export function AIAutoTagWidget() {
  const [recentNotes, setRecentNotes] = useState<any[]>([])

  useEffect(() => {
    // Fetch recent notes to show AI tagging in action
    fetch('/api/notes')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRecentNotes(data.slice(0, 2)) // Show 2 most recent
        }
      })
      .catch(() => {})
  }, [])

  return (
    <Card className="col-span-1 border-2 border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Brain className="h-5 w-5 text-primary" />
          AI Auto Tag & Summarize
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentNotes.length > 0 ? (
          recentNotes.map((note) => (
            <div
              key={note.id}
              className="h-24 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-center"
            >
              <div className="space-y-2">
                <Tags className="h-6 w-6 mx-auto text-gray-400 dark:text-gray-500" />
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {note.content?.substring(0, 50)}...
                </p>
                {note.category && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {note.category}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-center">
            <div className="space-y-2">
              <FileText className="h-6 w-6 mx-auto text-gray-400 dark:text-gray-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                AI-powered content insights coming soon.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
