'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Trophy, Zap, Target } from 'lucide-react'
import { useState, useEffect } from 'react'

// Habits & XP widget - shows gamification progress
// Fetches actual habit data to calculate streaks
export function HabitsXPWidget() {
  const [xp, setXp] = useState(650)
  const [level, setLevel] = useState(7)
  const [activeStreaks, setActiveStreaks] = useState(0)

  useEffect(() => {
    // Load habit data to count active streaks
    fetch('/api/habits')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const streaks = data.filter((h: any) => h.streak > 0)
          setActiveStreaks(streaks.length)
        }
      })
      .catch(() => {
        // Fail silently - defaults are fine
      })
  }, [])

  // Calculate progress to next level
  const levelXp = 1000
  const progress = (xp % levelXp) / levelXp

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[#FFBD44]" />
          Habits & XP
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Level {level} - Knowledge Seeker</p>
            <div className="flex items-center gap-1 text-xs text-[#FFBD44]">
              <Zap className="h-3 w-3" />
              <span>{xp} XP</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <Progress value={progress * 100} className="h-3 mb-4" />

          {/* Streak count */}
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-[#00C1B3]" />
            <span className="text-sm text-gray-600">{activeStreaks} Active Streaks</span>
          </div>

          {/* Achievement box */}
          <div className="h-24 bg-gray-50 rounded p-3 border border-gray-200">
            <p className="text-xs font-medium mb-1">Recent Achievement</p>
            <p className="text-xs text-gray-600">7-Day Streak Master</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
