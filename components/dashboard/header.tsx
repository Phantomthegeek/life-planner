'use client'

import { useState, useEffect } from 'react'
import { Search, Bell, Mic, ChevronDown } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Top header bar - responsive for mobile
export function Header() {
  const [flowMode, setFlowMode] = useState(false)
  const [search, setSearch] = useState('')
  const [name, setName] = useState('User')
  const [initials, setInitials] = useState('U')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) return

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', user.id)
          .single()

        if (profileError) {
          // If users table doesn't exist or query fails, fall back to email
          if (user.email) {
            const emailUser = user.email.split('@')[0]
            setName(emailUser.charAt(0).toUpperCase() + emailUser.slice(1))
            setInitials(emailUser[0].toUpperCase())
          }
          return
        }

        if (profile?.full_name) {
          setName(profile.full_name)
          const parts = profile.full_name.split(' ')
          const firstInitial = parts[0]?.[0] || ''
          const lastInitial = parts[parts.length - 1]?.[0] || ''
          setInitials((firstInitial + lastInitial).toUpperCase().slice(0, 2))
        } else if (user.email) {
          const emailUser = user.email.split('@')[0]
          setName(emailUser.charAt(0).toUpperCase() + emailUser.slice(1))
          setInitials(emailUser[0].toUpperCase())
        }
      } catch (err: any) {
        // Fail silently - defaults are fine
        // Check if it's a network/config error vs actual auth error
        if (err?.message?.includes('Missing Supabase') || err?.message?.includes('environment variables')) {
          console.warn('Supabase not configured')
        } else {
          console.error('Header: failed to load user', err)
        }
      }
    }

    loadUser()
  }, [supabase])

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      // Even if signOut fails, we should still redirect
      console.error('Logout error:', err)
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 right-0 left-0 md:left-64 z-40 flex items-center justify-between px-4 md:px-6">
      {/* Search bar - hidden on very small screens */}
      <div className="hidden sm:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        {/* Flow mode toggle - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Flow Mode</span>
          <Switch checked={flowMode} onCheckedChange={setFlowMode} />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        {/* Voice input - hidden on mobile */}
        <button className="hidden md:block p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <Mic className="h-5 w-5" />
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">{name}</span>
            <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
