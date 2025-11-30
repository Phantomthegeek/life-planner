import { createClient } from '@/lib/supabase/server'
import { PlannerView } from '@/components/planner/planner-view'
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Daily Planner</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Manage your schedule and tasks with time-blocking.
        </p>
      </div>
      <PlannerView initialTasks={tasks || []} />
    </div>
  )
}
