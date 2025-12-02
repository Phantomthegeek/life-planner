'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, Clock } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

// Flow Mode widget - quick access to focus sessions
// Keeping it simple - just duration selection and a start button
// The focus blocks visualization is placeholder for now
export function FlowModeWidget() {
  const [duration, setDuration] = useState(25)
  const durations = [25, 45, 60] // Pomodoro-style options

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-[#4D7CFE]" />
          Flow Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Duration buttons */}
        <div className="flex gap-2">
          {durations.map((mins) => (
            <button
              key={mins}
              onClick={() => setDuration(mins)}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                duration === mins
                  ? 'bg-[#4D7CFE] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Simple progress indicator - 6 blocks representing focus sessions */}
        {/* First 2 filled = completed, rest empty = available */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`h-16 rounded ${
                i <= 2 ? 'bg-[#4D7CFE]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <Link href="/dashboard/planner/focus">
          <Button className="w-full bg-[#4D7CFE] hover:bg-[#3D6CEE] text-white">
            <Clock className="mr-2 h-4 w-4" />
            Start Focus Session
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
