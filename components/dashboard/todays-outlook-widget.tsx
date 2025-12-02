'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'

// Today's Outlook widget - shows date, weather, and daily quote
// Weather is placeholder - would integrate with weather API in production
export function TodaysOutlookWidget() {
  const today = format(new Date(), 'EEEE MMMM d, yyyy')
  
  // Placeholder weather - real version would fetch from API
  const weather = '68°F, Partly cloudy, 10% chance of rain'

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Today&apos;s Outlook</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">{today}</p>
          <p className="text-xs text-gray-500">{weather}</p>
        </div>
        <div className="pt-4 border-t">
          <p className="text-xs italic text-gray-600">
            &quot;The secret of getting ahead is getting started. The secret of getting started is
            breaking your complex overwhelming tasks into small manageable tasks, and then starting
            on the first one.&quot;
          </p>
          <p className="text-xs text-gray-500 mt-2">— Mark Twain</p>
        </div>
      </CardContent>
    </Card>
  )
}
