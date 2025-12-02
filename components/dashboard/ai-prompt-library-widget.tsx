'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Brain, Sparkles } from 'lucide-react'
import { useState } from 'react'

// AI Prompt Library widget - browse and search saved prompts
export function AIPromptLibraryWidget() {
  const [query, setQuery] = useState('')

  // Mock categories - in production these come from the database
  const categories = [
    { name: 'Task Generation', count: 12 },
    { name: 'Content Creation', count: 8 },
    { name: 'Code Assistance', count: 15 },
    { name: 'Analysis & Insights', count: 10 },
  ]

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <Card className="col-span-1 border-2 border-[#2A2D7C]/20 hover:border-[#2A2D7C]/40 transition-colors">
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
        <div className="h-48 bg-gradient-to-br from-[#2A2D7C]/5 to-[#9C6ADE]/5 rounded-lg p-4 border border-[#2A2D7C]/10 dark:border-[#2A2D7C]/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[#9C6ADE]" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Categories</span>
          </div>
          <div className="space-y-2">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = '/dashboard/chat'}
                >
                  <span className="text-xs text-gray-700 dark:text-gray-200">{cat.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{cat.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No categories found.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
