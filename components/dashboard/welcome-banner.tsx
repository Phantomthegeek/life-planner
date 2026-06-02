'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function WelcomeBanner() {
  const [name, setName] = useState<string | null>(null)
  const [greeting, setGreeting] = useState('Welcome')

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()))

    const supabase = createClient()
    ;(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // public.users is the source of truth for display name. Falling back to
        // the email prefix is ugly but better than rendering nothing.
        const { data } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (data?.full_name) {
          setName(data.full_name.split(' ')[0])
        } else if (user.email) {
          const prefix = user.email.split('@')[0]
          setName(prefix.charAt(0).toUpperCase() + prefix.slice(1))
        }
      } catch {
        // Non-critical; just don't render the banner.
      }
    })()
  }, [])

  if (!name) return null

  return (
    <Card className="p-4 md:p-5">
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
        {greeting}, {name}.
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Here&apos;s what your day looks like.
      </p>
    </Card>
  )
}
