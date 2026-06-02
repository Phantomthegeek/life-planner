'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Settings, X } from 'lucide-react'

const DISMISS_KEY = 'arcana-setup-nudge-dismissed'

/**
 * Shown on the dashboard for new users whose wake/sleep/work hours are still at
 * the defaults. Encourages them to personalize so the AI coach can build
 * realistic plans instead of guessing. Dismissable, remembered in localStorage.
 */
export function SetupNudge() {
  const [show, setShow] = useState(false)
  const [missing, setMissing] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(DISMISS_KEY) === '1') return

    const supabase = createClient()
    ;(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('users')
          .select('full_name, wake_time, sleep_time, work_hours_start, work_hours_end')
          .eq('id', user.id)
          .single()

        if (!data) return

        const issues: string[] = []
        if (!data.full_name) issues.push('your name')
        // Defaults set by the signup/settings code paths
        const defaults = {
          wake_time: '07:00',
          sleep_time: '23:00',
          work_hours_start: '09:00',
          work_hours_end: '17:00',
        }
        const hasOnlyDefaults =
          data.wake_time === defaults.wake_time &&
          data.sleep_time === defaults.sleep_time &&
          data.work_hours_start === defaults.work_hours_start &&
          data.work_hours_end === defaults.work_hours_end
        if (hasOnlyDefaults) issues.push('your daily schedule')

        if (issues.length === 0) return
        setMissing(issues)
        setShow(true)
      } catch {
        /* silently skip — non-critical */
      }
    })()
  }, [])

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, '1')
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <Card className="border-l-2 border-l-amber-500/70">
      <CardContent className="p-4 flex items-start gap-3">
        <Settings className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            Tell Arcana {missing.join(' and ')} so daily plans match your real schedule.
            Takes about 30 seconds.
          </p>
          <div className="mt-2 flex gap-1">
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/settings">Open settings</Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Later
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0 -mr-1"
          onClick={dismiss}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  )
}
