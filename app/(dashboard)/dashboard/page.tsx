import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DailyBriefingWidget } from '@/components/dashboard/daily-briefing-widget'
import { SuggestedFocusWidget } from '@/components/dashboard/suggested-focus-widget'
import { TodaysOutlookWidget } from '@/components/dashboard/todays-outlook-widget'
import { TimeWarpWidget } from '@/components/dashboard/time-warp-widget'
import { ArcanaConnectWidget } from '@/components/dashboard/arcana-connect-widget'
import { FlowModeWidget } from '@/components/dashboard/flow-mode-widget'
import { AIPromptLibraryWidget } from '@/components/dashboard/ai-prompt-library-widget'
import { HabitsXPWidget } from '@/components/dashboard/habits-xp-widget'
import { AIAutoTagWidget } from '@/components/dashboard/ai-auto-tag-widget'
import { WeeklyReportWidget } from '@/components/dashboard/weekly-report-widget'
import { TodaysHabitsWidget } from '@/components/dashboard/todays-habits-widget'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner />
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-3 gap-6">
        <DailyBriefingWidget />
        <SuggestedFocusWidget />
        <TodaysOutlookWidget />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-3 gap-6">
        <TimeWarpWidget />
        <ArcanaConnectWidget />
        <FlowModeWidget />
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-3 gap-6">
        <AIPromptLibraryWidget />
        <HabitsXPWidget />
        <AIAutoTagWidget />
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-2 gap-6">
        <WeeklyReportWidget />
        <TodaysHabitsWidget />
      </div>

      {/* Extensions section - placeholder for future marketplace */}
      <div className="bg-[#9C6ADE] text-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Extensions Marketplace</h2>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/20 rounded border border-white/30"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
