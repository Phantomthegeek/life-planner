'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link2, Network } from 'lucide-react'

// Arcana Connect widget - shows linked notes and knowledge graph connections
// This is simplified - real version would fetch actual note connections
export function ArcanaConnectWidget() {
  // Mock data - in production this comes from the knowledge graph
  const connectedNotes = [
    { id: 1, title: 'Project Phoenix', linkCount: 5 },
    { id: 2, title: 'API Documentation', linkCount: 3 },
  ]

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="h-5 w-5 text-[#00C1B3]" />
          Arcana Connect
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Network className="h-4 w-4 text-[#00C1B3]" />
            <p className="text-sm font-medium">Connected Notes</p>
          </div>

          {/* Note connection list */}
          <div className="space-y-2 mb-4">
            {connectedNotes.map((note) => (
              <div
                key={note.id}
                className="h-16 bg-gray-50 rounded p-3 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{note.title}</p>
                  <span className="text-xs text-gray-500">{note.linkCount} links</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Bi-directional connections</p>
              </div>
            ))}
          </div>

          <Button className="w-full bg-[#00C1B3] hover:bg-[#00B1A3] text-white" variant="outline">
            <Network className="mr-2 h-4 w-4" />
            View Knowledge Graph
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
