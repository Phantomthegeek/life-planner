'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Loader2, Calendar, TrendingUp, AlertCircle, Lightbulb, Target } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate, subDays } from '@/lib/utils'

interface WeeklyReview {
  summary: string
  achievements: string[]
  challenges: string[]
  patterns: string[]
  recommendations: string[]
  nextWeekFocus: string[]
  week_start?: string
  week_end?: string
}

export default function WeeklyReviewPage() {
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState<WeeklyReview | null>(null)
  const [weekStartDate, setWeekStartDate] = useState(
    formatDate(subDays(new Date(), 7))
  )
  const { toast } = useToast()

  const generateReview = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/weekly-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_start_date: weekStartDate,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate weekly review')
      }

      const data = await response.json()
      setReview(data)

      toast({
        title: 'Weekly Review Generated!',
        description: 'Your AI-powered weekly review is ready.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate weekly review',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weekly AI Review</h1>
        <p className="text-muted-foreground">
          Get insights and recommendations based on your week&apos;s activities.
        </p>
      </div>

      {!review ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Weekly Review
            </CardTitle>
            <CardDescription>
              AI will analyze your notes, tasks, and habits to provide insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weekStart">Week Start Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="weekStart"
                  type="date"
                  value={weekStartDate}
                  onChange={(e) => setWeekStartDate(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Select the start date of the week you want to review
              </p>
            </div>
            <Button onClick={generateReview} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Review...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Weekly Review
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Week Summary</CardTitle>
              <CardDescription>
                {review.week_start &&
                  review.week_end &&
                  `${new Date(review.week_start).toLocaleDateString()} - ${new Date(review.week_end).toLocaleDateString()}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{review.summary}</p>
            </CardContent>
          </Card>

          {/* Achievements */}
          {review.achievements && review.achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.achievements.map((achievement, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Challenges */}
          {review.challenges && review.challenges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.challenges.map((challenge, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Patterns */}
          {review.patterns && review.patterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Patterns & Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.patterns.map((pattern, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">💡</span>
                      <span>{pattern}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {review.recommendations && review.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Next Week Focus */}
          {review.nextWeekFocus && review.nextWeekFocus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Next Week Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {review.nextWeekFocus.map((focus, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border bg-primary/5"
                    >
                      <span className="font-medium">{focus}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Button variant="outline" onClick={() => setReview(null)}>
            Generate New Review
          </Button>
        </div>
      )}
    </div>
  )
}

