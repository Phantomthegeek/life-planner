'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Calendar, Brain, Loader2, ArrowLeft, Play } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface StudyPlanItem {
  date: string
  module_id: string
  module_title: string
  duration_minutes: number
  study_method: string
  notes: string
}

interface StudyPlan {
  cert_id: string
  cert_name: string
  total_hours: number
  weeks_to_completion: number
  study_schedule: StudyPlanItem[]
  weekly_breakdown: Array<{
    week: number
    hours: number
    modules: string[]
    focus: string
  }>
  recommendations: string[]
}

export default function StudyPlanPage() {
  const params = useParams()
  const certId = params.id as string
  const [loading, setLoading] = useState(false)
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null)
  const [hoursPerWeek, setHoursPerWeek] = useState(10)
  const [certification, setCertification] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCertification()
  }, [certId])

  const fetchCertification = async () => {
    try {
      const response = await fetch('/api/certifications')
      const certs = await response.json()
      const cert = certs.find((c: any) => c.id === certId || c.progress?.cert_id === certId)
      if (cert) {
        setCertification(cert.progress ? cert : cert)
      }
    } catch (error) {
      console.error('Error fetching certification:', error)
    }
  }

  const generateStudyPlan = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/certification-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cert_id: certId,
          hours_per_week: hoursPerWeek,
          start_date: formatDate(new Date()),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate study plan')
      }

      const plan = await response.json()
      setStudyPlan(plan)

      toast({
        title: 'Study Plan Generated!',
        description: `Your ${plan.weeks_to_completion}-week study plan is ready.`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate study plan',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const applyStudyPlan = async () => {
    if (!studyPlan) return

    try {
      // Ensure date format is YYYY-MM-DD
      const normalizeDate = (dateStr: string): string => {
        const d = new Date(dateStr)
        return d.toISOString().split('T')[0]
      }

      const tasks = studyPlan.study_schedule.map((item) => {
        // Normalize the date to ensure YYYY-MM-DD format
        const normalizedDate = normalizeDate(item.date)
        const startTime = new Date(`${normalizedDate}T09:00:00`)
        const endTime = new Date(startTime.getTime() + item.duration_minutes * 60 * 1000)

        return {
          title: `Study: ${item.module_title}`,
          detail: `${item.study_method} - ${item.notes}`,
          date: normalizedDate, // Ensure consistent format
          duration_minutes: item.duration_minutes,
          category: 'study',
          cert_id: certId,
          module_id: item.module_id,
          start_ts: startTime.toISOString(),
          end_ts: endTime.toISOString(),
        }
      })

      const responses = await Promise.all(
        tasks.map((task) =>
          fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
          }).then(res => res.json())
        )
      )

      // Check for errors
      const errors = responses.filter(r => r.error)
      if (errors.length > 0) {
        throw new Error(`Failed to create ${errors.length} task(s)`)
      }

      toast({
        title: 'Study Plan Applied!',
        description: `Successfully added ${responses.length} study sessions to your calendar.`,
      })

      // Wait a moment for the toast, then navigate and force refresh
      setTimeout(() => {
        // Use window.location with timestamp to force a fresh page load
        window.location.href = `/dashboard/planner?refresh=${Date.now()}`
      }, 1500)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply study plan',
        variant: 'destructive',
      })
    }
  }

  if (!certification) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/certifications/${certId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Study Plan</h1>
          <p className="text-muted-foreground">
            Generate a personalized study plan for {certification.name || certification.certifications?.name}
          </p>
        </div>
      </div>

      {!studyPlan ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Generate Study Plan
            </CardTitle>
            <CardDescription>
              AI will create a customized study schedule based on your certification modules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Study Hours Per Week</Label>
              <Input
                id="hours"
                type="number"
                min="1"
                max="40"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(parseInt(e.target.value) || 10)}
              />
              <p className="text-sm text-muted-foreground">
                How many hours per week can you dedicate to studying?
              </p>
            </div>
            <Button onClick={generateStudyPlan} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Generate Study Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Plan Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Study Plan Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold">{studyPlan.total_hours}</div>
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{studyPlan.weeks_to_completion}</div>
                  <div className="text-sm text-muted-foreground">Weeks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{studyPlan.study_schedule.length}</div>
                  <div className="text-sm text-muted-foreground">Study Sessions</div>
                </div>
              </div>
              {studyPlan.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {studyPlan.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Breakdown */}
          {studyPlan.weekly_breakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studyPlan.weekly_breakdown.map((week) => (
                    <div key={week.week} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Week {week.week}</h3>
                        <span className="text-sm text-muted-foreground">
                          {week.hours} hours
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{week.focus}</p>
                      <div className="flex flex-wrap gap-2">
                        {week.modules.map((module, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded bg-secondary"
                          >
                            {module}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Study Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Study Schedule</CardTitle>
              <CardDescription>
                Daily study sessions (first 10 days shown)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {studyPlan.study_schedule.slice(0, 10).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 rounded-lg border"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{item.module_title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })} • {item.duration_minutes} min • {item.study_method}
                      </div>
                      {item.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {studyPlan.study_schedule.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    +{studyPlan.study_schedule.length - 10} more sessions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStudyPlan(null)}>
              Generate New Plan
            </Button>
            <Button onClick={applyStudyPlan} className="flex-1">
              <Play className="mr-2 h-4 w-4" />
              Apply to Calendar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

