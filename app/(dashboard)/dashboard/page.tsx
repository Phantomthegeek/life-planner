import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DailyBriefingWidget } from '@/components/dashboard/daily-briefing-widget'
import { SuggestedFocusWidget } from '@/components/dashboard/suggested-focus-widget'
import { TodaysOutlookWidget } from '@/components/dashboard/todays-outlook-widget'
import { WeeklyReportWidget } from '@/components/dashboard/weekly-report-widget'
import { TodaysHabitsWidget } from '@/components/dashboard/todays-habits-widget'
import { RecentActivityWidget } from '@/components/dashboard/recent-activity-widget'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { V01QuickActions } from '@/components/dashboard/v01-quick-actions'
import { HabitsSummaryWidget } from '@/components/dashboard/habits-summary-widget'
import { SetupNudge } from '@/components/dashboard/setup-nudge'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <WelcomeBanner />
      <SetupNudge />
      <V01QuickActions />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <DailyBriefingWidget />
        <SuggestedFocusWidget />
        <TodaysOutlookWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <WeeklyReportWidget />
        <TodaysHabitsWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <HabitsSummaryWidget />
        <RecentActivityWidget />
      </div>
    </div>
  )
}
