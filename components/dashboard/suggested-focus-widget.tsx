'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'

// Suggested Focus widget - shows AI-recommended task based on patterns
// This is a placeholder - real implementation would analyze user's productivity data
export function SuggestedFocusWidget() {
  const suggestedTask = 'Project Phoenix Documentation'
  const reasoning = 'Based on your schedule and recent activities.'

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[#FFBD44]" />
          Suggested Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">{suggestedTask}</p>
          <p className="text-xs text-gray-500 mb-4">{reasoning}</p>

          {/* Simple bar chart showing productivity over week */}
          <div className="h-20 bg-gray-50 rounded mb-2 p-2 flex items-end justify-between gap-1">
            {[40, 60, 80, 90, 75, 65, 50].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-[#FFBD44] rounded-t"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          <p className="text-xs text-gray-600">
            You&apos;ve been most productive on this project between 9-11 AM. Consider blocking
            this time today.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
