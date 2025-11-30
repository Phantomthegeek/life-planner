'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, AlertCircle, Trophy, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function MotivationWidget() {
  const [motivation, setMotivation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/motivation/generate?context=contextual')
      .then((res) => res.json())
      .then((data) => {
        setMotivation(data)
      })
      .catch((error) => {
        console.error('Error fetching motivation:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!motivation) return null

  const { type, message, action_url, action_text } = motivation

  const icons = {
    achievement: Trophy,
    encouragement: TrendingUp,
    warning: AlertCircle,
    celebration: Sparkles,
  }

  const Icon = icons[type] || Sparkles

  const colors = {
    achievement: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-400',
    encouragement: 'bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-400',
    warning: 'bg-orange-500/10 border-orange-500/50 text-orange-700 dark:text-orange-400',
    celebration: 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400',
  }

  return (
    <Card className={`card-hover border-2 ${colors[type]}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium leading-relaxed">
              {message}
            </p>
            {action_url && action_text && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(action_url)}
                className="mt-2"
              >
                {action_text}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

