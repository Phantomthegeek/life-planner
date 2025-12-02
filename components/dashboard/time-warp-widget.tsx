'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, History } from 'lucide-react'

// Time Warp widget - shows version history for documents
// This is a simplified version - full implementation would fetch actual version data
export function TimeWarpWidget() {
  // Mock data for now - in real app this would come from API
  const versionCount = 10
  const projectName = 'Project Outline'

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#9C6ADE]" />
          Time Warp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">{projectName}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <History className="h-3 w-3" />
              <span>{versionCount} versions</span>
            </div>
          </div>

          {/* Simple timeline - just shows we have version history */}
          <div className="h-12 bg-gray-100 rounded mb-4 flex items-center justify-center">
            <span className="text-xs text-gray-500">Version timeline</span>
          </div>

          {/* Version info box */}
          <div className="h-24 bg-gray-50 rounded mb-4 p-3">
            <p className="text-xs text-gray-600">
              Track changes and restore previous versions of your documents.
            </p>
          </div>

          <Button className="w-full bg-[#9C6ADE] hover:bg-[#8C5ACE] text-white" variant="outline">
            Compare Versions
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
