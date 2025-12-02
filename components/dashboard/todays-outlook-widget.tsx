'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Clock, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'

// Today's Outlook widget - shows today's date, task summary, and productivity insights
export function TodaysOutlookWidget() {
  const [todaysTasks, setTodaysTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTodaysData = async () => {
      try {
        const today = formatDate(new Date())
        const response = await fetch(`/api/tasks?date=${today}`)
        if (response.ok) {
          const tasks = await response.json()
          setTodaysTasks(Array.isArray(tasks) ? tasks : [])
        }
      } catch (err) {
        console.error('Failed to load today\'s tasks:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTodaysData()
  }, [])

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })

  const completedTasks = todaysTasks.filter(t => t.done).length
  const totalTasks = todaysTasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const upcomingTasks = todaysTasks.filter(t => !t.done && t.start_ts).length

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Today&apos;s Outlook</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">{today}</p>
          {loading ? (
            <p className="text-xs text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <CheckSquare className="h-3 w-3 text-green-500" />
                <span className="text-gray-600">
                  {completedTasks} of {totalTasks} tasks completed
                </span>
              </div>
              {completionRate > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="text-gray-600">{completionRate}% completion rate</span>
                </div>
              )}
              {upcomingTasks > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 text-orange-500" />
                  <span className="text-gray-600">{upcomingTasks} scheduled task{upcomingTasks !== 1 ? 's' : ''} coming up</span>
                </div>
              )}
              {totalTasks === 0 && (
                <p className="text-xs text-gray-500">No tasks scheduled for today</p>
              )}
            </div>
          )}
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
