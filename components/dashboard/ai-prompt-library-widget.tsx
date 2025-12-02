'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Brain } from 'lucide-react'
import { useState } from 'react'

// AI Prompt Library widget - browse and search saved prompts
// This is a placeholder - real version would fetch from database
export function AIPromptLibraryWidget() {
  const [query, setQuery] = useState('')

  // Mock categories - in production these come from the database
  const categories = [
    { name: 'Task Generation', count: 12 },
    { name: 'Content Creation', count: 8 },
    { name: 'Code Assistance', count: 15 },
    { name: 'Analysis & Insights', count: 10 },
  ]

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#2A2D7C]" />
          AI Prompt Library
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search Prompts..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Category list */}
        <div className="h-48 bg-gray-50 rounded p-4 border border-gray-200">
          <p className="text-sm font-medium mb-3">Categories</p>
          <div className="space-y-2">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded hover:bg-white cursor-pointer"
              >
                <span className="text-xs text-gray-700">{cat.name}</span>
                <span className="text-xs text-gray-500">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
