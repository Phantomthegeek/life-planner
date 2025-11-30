import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, BookOpen, Target, Brain, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { EnergyForecastWidget } from '@/components/dashboard/energy-forecast-widget'
import { MotivationWidget } from '@/components/dashboard/motivation-widget'
import { EnhancedProgress } from '@/components/progress/enhanced-progress'
import { Task } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const today = formatDate(new Date())

  // Fetch today's tasks
  const { data: tasks } = (await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .order('start_ts', { ascending: true })) as { data: Task[] | null }

  // Fetch habits
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)

  // Fetch active certifications
  const { data: certProgress } = await supabase
    .from('user_cert_progress')
    .select(`
      *,
      certifications (*)
    `)
    .eq('user_id', user.id)
    .lt('progress', 100)

  const completedTasks = (tasks?.filter((t: any) => t.done) || []).length
  const totalTasks = tasks?.length || 0

  return (
    <div className="space-y-4 md:space-y-8 relative">
      <div className="space-y-2 bounce-in">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight gradient-text">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm md:text-lg fade-in-up">
          Welcome back! Here&apos;s your overview for today. ✨
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glow-card card-glow hover-lift vibrant-bg border-2 hover:border-primary/50 transition-all duration-300 slide-in-left">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Today&apos;s Tasks</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {completedTasks} / {totalTasks}
            </div>
            <p className="text-sm text-muted-foreground">
              {totalTasks > 0
                ? `${Math.round((completedTasks / totalTasks) * 100)}% complete`
                : 'No tasks today'}
            </p>
            {totalTasks > 0 && (
              <div className="mt-4">
                <EnhancedProgress
                  value={Math.round((completedTasks / totalTasks) * 100)}
                  animated={true}
                  showIcon={true}
                  variant={completedTasks === totalTasks ? 'success' : 'default'}
                  size="md"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glow-card card-glow hover-lift vibrant-bg border-2 hover:border-primary/50 transition-all duration-300 fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Active Habits</CardTitle>
            <div className="p-2 rounded-lg bg-accent/10">
              <Target className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{habits?.length || 0}</div>
            <p className="text-sm text-muted-foreground">
              {(habits?.filter((h: any) => h.streak > 0) || []).length} with active streaks
            </p>
          </CardContent>
        </Card>

        <Card className="glow-card card-glow hover-lift vibrant-bg border-2 hover:border-primary/50 transition-all duration-300 slide-in-right">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Certifications</CardTitle>
            <div className="p-2 rounded-lg bg-secondary/10">
              <BookOpen className="h-5 w-5 text-secondary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {certProgress?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card className="glow-card card-glow hover-lift vibrant-bg border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-primary/5 to-secondary/5 pulse-glow-vibrant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">AI Coach</CardTitle>
            <div className="p-2 rounded-lg bg-primary/20 float">
              <Brain className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/coach">
              <Button className="w-full shadow-lg shimmer-button gradient-animate bg-gradient-to-r from-primary to-secondary">
                Get Daily Plan ✨
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card className="card-glow hover-lift vibrant-bg border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl gradient-text font-bold">Today&apos;s Tasks</CardTitle>
              <CardDescription className="text-base mt-1">{today}</CardDescription>
            </div>
            <Link href="/dashboard/planner">
              <Button className="shimmer-button hover-lift">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 rounded-xl border-2 p-4 hover:border-primary/50 hover:shadow-lg transition-all duration-300 group hover-lift card-glow fade-in-up"
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    readOnly
                    className="h-5 w-5 rounded-md border-2 cursor-pointer accent-primary"
                  />
                  <div className="flex-1">
                    <p
                      className={
                        task.done
                          ? 'text-muted-foreground line-through text-base'
                          : 'font-semibold text-base'
                      }
                    >
                      {task.title}
                    </p>
                    {task.start_ts && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(task.start_ts).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground text-lg">
                No tasks scheduled for today. Add some tasks to get started!
              </p>
              <Link href="/dashboard/planner">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Task
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <EnergyForecastWidget />
        <MotivationWidget />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/planner">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
            </Link>
            <Link href="/dashboard/certifications">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Manage Certifications
              </Button>
            </Link>
            <Link href="/dashboard/habits">
              <Button variant="outline" className="w-full justify-start">
                <Target className="mr-2 h-4 w-4" />
                Track Habits
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            {certProgress && certProgress.length > 0 ? (
              <div className="space-y-3">
                {certProgress.slice(0, 3).map((progress: any) => (
                  <div key={progress.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {progress.certifications?.name || 'Unknown'}
                      </span>
                      <span className="text-muted-foreground">
                        {progress.progress}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No active certifications. Add one to get started!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

