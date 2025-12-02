'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'

// Today's Habits widget - shows habits to check off today
// Fetches actual habit data from the API
export function TodaysHabitsWidget() {
  const [habits, setHabits] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/habits')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHabits(data.slice(0, 5)) // Show first 5
        }
      })
      .catch(() => {})
  }, [])

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Today&apos;s Habits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 bg-gray-50 rounded p-4">
          {habits.length > 0 ? (
            <div className="space-y-2">
              {habits.map((habit) => (
                <div key={habit.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>{habit.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center pt-8">
              No habits set up yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
