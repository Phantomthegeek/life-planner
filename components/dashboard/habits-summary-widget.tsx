'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Trophy, Zap, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useGamificationStore } from '@/stores/use-gamification-store'

const XP_PER_LEVEL = 1000

export function HabitsSummaryWidget() {
  const { xp, level, totalTasksCompleted } = useGamificationStore()
  const [activeStreaks, setActiveStreaks] = useState(0)
  const [habitCount, setHabitCount] = useState(0)

  useEffect(() => {
    fetch('/api/habits')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHabitCount(data.length)
          setActiveStreaks(data.filter((h: { streak?: number }) => (h.streak ?? 0) > 0).length)
        }
      })
      .catch(() => {})
  }, [])

  const progress = ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100
  const xpToNext = XP_PER_LEVEL - (xp % XP_PER_LEVEL)

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[#FFBD44]" />
          Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Level {level}</p>
            <div className="flex items-center gap-1 text-xs text-[#FFBD44]">
              <Zap className="h-3 w-3" />
              <span>{xp} XP</span>
            </div>
          </div>
          <Progress value={progress} className="h-3 mb-1" />
          <p className="text-xs text-muted-foreground">{xpToNext} XP to next level</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">Tasks done</p>
            <p className="text-xl font-semibold">{totalTasksCompleted}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs flex items-center gap-1">
              <Target className="h-3 w-3" />
              Active streaks
            </p>
            <p className="text-xl font-semibold">
              {activeStreaks}
              <span className="text-xs font-normal text-muted-foreground">
                {' '}
                / {habitCount} habits
              </span>
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/dashboard/achievements">View achievements</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
