import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PlannerView } from '@/components/planner/planner-view'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export default async function PlannerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const today = formatDate(new Date())
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 13) // Fetch 2 weeks ahead to include study plan tasks

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', formatDate(weekStart))
    .lte('date', formatDate(weekEnd))
    .order('date', { ascending: true })
    .order('start_ts', { ascending: true })

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Daily Planner</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your schedule and tasks with time-blocking.
          </p>
        </div>
        {/* The weekly grid scrolls horizontally on mobile and is awkward to
            use on a small screen. Surface the single-day timetable as a
            prominent shortcut — it's a much better mobile experience. */}
        <Button asChild variant="outline" size="sm" className="md:hidden">
          <Link href="/dashboard/planner/timetable">
            <Calendar className="mr-2 h-4 w-4" />
            Day view
          </Link>
        </Button>
      </div>
      {/* Note for mobile users that horizontal scroll is intentional. */}
      <p className="md:hidden text-xs text-muted-foreground">
        Tip: swipe the calendar sideways, or tap <span className="font-medium">Day view</span> above for a single-day layout.
      </p>
      <PlannerView initialTasks={tasks || []} />
    </div>
  )
}
