'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart2, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Weekly Report widget - generates weekly productivity reports
export function WeeklyReportWidget() {
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      // Navigate to coach page which has weekly review functionality
      router.push('/dashboard/coach/weekly-review')
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card className="col-span-1 border-2 border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <BarChart2 className="h-5 w-5 text-primary" />
          Weekly Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-center">
          <div className="space-y-2">
            <FileText className="h-6 w-6 mx-auto text-gray-400 dark:text-gray-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate your personalized weekly productivity report.
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Review your progress, identify patterns, and plan for the next week with AI-driven insights.
        </p>
        <Button
          onClick={handleGenerateReport}
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
