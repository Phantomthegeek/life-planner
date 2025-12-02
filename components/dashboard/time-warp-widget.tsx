'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, GitBranch, History } from 'lucide-react'
import { useState, useEffect } from 'react'

// Time Warp widget - shows version history for documents
export function TimeWarpWidget() {
  const [versionCount, setVersionCount] = useState(0)
  const [recentVersions, setRecentVersions] = useState<any[]>([])

  useEffect(() => {
    // Fetch notes to count as "versions"
    fetch('/api/notes')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVersionCount(data.length)
          // Create mock version history from notes
          setRecentVersions(
            data.slice(0, 5).map((note: any, idx: number) => ({
              id: note.id,
              date: new Date(note.date).toLocaleDateString(),
              label: `Version ${data.length - idx}`,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  return (
    <Card className="col-span-1 border-2 border-[#9C6ADE]/20 hover:border-[#9C6ADE]/40 transition-colors">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#9C6ADE]" />
          Time Warp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Outline</p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <History className="h-3 w-3" />
              <span>{versionCount} versions</span>
            </div>
          </div>

          {/* Visual Timeline */}
          <div className="relative h-12 mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-between px-2">
              {recentVersions.slice(0, 5).map((version, idx) => (
                <div
                  key={version.id}
                  className="relative"
                  style={{ left: `${(idx / 4) * 100}%` }}
                >
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      idx === 0
                        ? 'bg-[#9C6ADE] border-[#9C6ADE]'
                        : 'bg-white border-gray-400 dark:bg-gray-600 dark:border-gray-500'
                    }`}
                  ></div>
                  {idx === 0 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-[#9C6ADE] font-medium whitespace-nowrap">
                      Today
                    </div>
                  )}
                </div>
              ))}
            </div>
            {recentVersions.length > 0 && (
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{recentVersions[recentVersions.length - 1]?.date}</span>
                <span>{recentVersions[0]?.date}</span>
              </div>
            )}
          </div>

          {/* Version Info */}
          <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded mb-4 p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="h-4 w-4 text-[#9C6ADE]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Latest Changes</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Semantic versioning tracks significant changes automatically.
            </p>
          </div>

          <Button
            className="w-full bg-[#9C6ADE] hover:bg-[#AC7ADE] text-white shadow-md"
            onClick={() => window.location.href = '/dashboard/notes'}
          >
            Compare Versions
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
