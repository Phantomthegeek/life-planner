'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

// Weekly Report widget - template for generating weekly summaries
// This will link to the report generator when implemented
export function WeeklyReportWidget() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Weekly Report Template
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 bg-gray-50 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Generate your weekly productivity report</p>
          <p className="text-xs text-gray-500">
            Includes tasks completed, habits maintained, and insights from the week.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
