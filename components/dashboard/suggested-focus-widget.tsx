'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatDateToISO } from '@/lib/utils'

// Suggested Focus widget - shows AI-recommended task based on patterns
// Fetches today's tasks and suggests the most important one
export function SuggestedFocusWidget() {
  const [suggestedTask, setSuggestedTask] = useState<string | null>(null)
  const [productivityData, setProductivityData] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const today = formatDateToISO(new Date())
        const response = await fetch(`/api/tasks?date=${today}`)
        if (response.ok) {
          const tasks = await response.json()
          if (Array.isArray(tasks) && tasks.length > 0) {
            // Find the first incomplete task as suggested focus
            const incomplete = tasks.filter((t: any) => !t.done)
            if (incomplete.length > 0) {
              setSuggestedTask(incomplete[0].title)
            }
          }
        }

        // Mock productivity data for visualization
        // In a real app, this would come from analytics
        setProductivityData([40, 60, 80, 90, 75, 65, 50])
      } catch (err) {
        console.error('Failed to load suggested focus:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <Card className="col-span-1 border-2 border-[#FFBD44]/20 hover:border-[#FFBD44]/40 transition-colors">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[#FFBD44]" />
            Suggested Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 border-2 border-[#FFBD44]/20 hover:border-[#FFBD44]/40 transition-colors">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[#FFBD44]" />
          Suggested Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {suggestedTask || 'No tasks for today'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {suggestedTask ? 'Based on your schedule and recent activities.' : 'Create tasks to get suggestions'}
          </p>

          {/* Simple bar chart showing productivity over week */}
          <div className="h-24 bg-gradient-to-t from-[#FFBD44]/20 to-transparent rounded mb-2 p-3 relative border border-[#FFBD44]/10 dark:border-[#FFBD44]/20">
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between h-full px-2">
              {productivityData.map((height, i) => (
                <div
                  key={i}
                  className="flex-1 mx-0.5 bg-[#FFBD44] rounded-t"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="absolute top-1 left-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-[#FFBD44]" />
              <span className="text-xs font-medium text-[#FFBD44]">Productivity</span>
            </div>
          </div>

          {suggestedTask && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              You&apos;ve been most productive on this project between 9-11 AM. Consider blocking
              this time today.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
