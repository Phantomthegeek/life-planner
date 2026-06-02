'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { GlobalSearch } from '@/components/search/global-search'
import { NotificationBell } from '@/components/dashboard/notification-bell'

// Top bar that sits above the dashboard content. Search lives on the left,
// account menu on the right. Anchored beside the sidebar on desktop (md+)
// and full width on mobile.
export function Header() {
  const [name, setName] = useState('User')
  const [initials, setInitials] = useState('U')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // public.users is the source of truth for display name. Fall back to
        // the email prefix if the row hasn't been created yet.
        const { data: profile } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (profile?.full_name) {
          setName(profile.full_name)
          setInitials(initialsFromName(profile.full_name))
        } else if (user.email) {
          const prefix = user.email.split('@')[0]
          setName(prefix.charAt(0).toUpperCase() + prefix.slice(1))
          setInitials(prefix[0]?.toUpperCase() ?? 'U')
        }
      } catch {
        // Non-critical: leave defaults in place.
      }
    }

    loadUser()
  }, [])

  const logout = async () => {
    const supabase = createClient()
    try {
      await supabase.auth.signOut()
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <header className="h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border fixed top-0 right-0 left-0 md:left-64 z-40 flex items-center gap-3 px-4 md:px-6 pl-16 md:pl-6">
      {/* Search lives left of the avatar. The pl-16 on mobile leaves room for
          the sidebar's hamburger button which is positioned at top-4 left-4. */}
      <div className="flex-1 min-w-0 max-w-md">
        <GlobalSearch />
      </div>

      <NotificationBell />

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-muted rounded-md px-2 py-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium truncate max-w-[140px]">
            {name}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 z-[60]">
          <DropdownMenuItem
            onSelect={() => router.push('/dashboard/settings')}
            className="cursor-pointer"
          >
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => router.push('/dashboard/settings/profile')}
            className="cursor-pointer"
          >
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={logout} className="cursor-pointer text-destructive focus:text-destructive">
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

function initialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (first + last).toUpperCase().slice(0, 2) || 'U'
}
