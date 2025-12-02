'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain } from 'lucide-react'

// AI Auto Tag widget - shows AI-powered tagging and summarization features
// Placeholder for now - will show recent auto-tagged content when implemented
export function AIAutoTagWidget() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#2A2D7C]" />
          AI Auto Tag & Summarize
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 bg-gray-50 rounded p-4 flex items-center justify-center">
          <p className="text-sm text-gray-500 text-center">
            AI automatically tags and summarizes your notes and tasks
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
