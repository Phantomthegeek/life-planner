'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Trophy, Star, Zap } from 'lucide-react'
import { useGamificationStore } from '@/stores/use-gamification-store'

export default function AchievementsPage() {
  const { xp, level, totalTasksCompleted, achievements } = useGamificationStore()
  const xpForNextLevel = 1000 - (xp % 1000)

  const unlockedAchievements = achievements.filter((a) => a.unlockedAt)
  const lockedAchievements = achievements.filter((a) => !a.unlockedAt)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">
          Track your progress and unlock achievements.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {level}</div>
            <p className="text-xs text-muted-foreground">
              {xp} XP • {xpForNextLevel} XP to next level
            </p>
            <Progress value={(xp % 1000) / 10} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasksCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Total tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {unlockedAchievements.length} / {achievements.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Unlocked achievements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Unlocked</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unlockedAchievements.map((achievement) => (
              <Card key={achievement.id} className="border-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    {achievement.name}
                  </CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {achievement.unlockedAt && (
                    <p className="text-xs text-muted-foreground">
                      Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">In Progress</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lockedAchievements.map((achievement) => {
              const progress = (achievement.progress / achievement.maxProgress) * 100
              return (
                <Card key={achievement.id} className="opacity-60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{achievement.icon}</span>
                      {achievement.name}
                    </CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {achievement.progress} / {achievement.maxProgress}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

