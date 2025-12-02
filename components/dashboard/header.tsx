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

// Top header bar - fixed position, contains search and user controls
// The left-64 offset accounts for the sidebar width
export function Header() {
  const [flowMode, setFlowMode] = useState(false)
  const [search, setSearch] = useState('')
  const [name, setName] = useState('User')
  const [initials, setInitials] = useState('U')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Load user name for display
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get name from users table
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', user.id)
          .single()

        if (profile?.full_name) {
          setName(profile.full_name)
          // Get initials from full name
          const parts = profile.full_name.split(' ')
          const firstInitial = parts[0]?.[0] || ''
          const lastInitial = parts[parts.length - 1]?.[0] || ''
          setInitials((firstInitial + lastInitial).toUpperCase().slice(0, 2))
        } else if (user.email) {
          // Fallback to email username
          const emailUser = user.email.split('@')[0]
          setName(emailUser.charAt(0).toUpperCase() + emailUser.slice(1))
          setInitials(emailUser[0].toUpperCase())
        }
      } catch (err) {
        // Fail silently - defaults are fine
        console.error('Header: failed to load user', err)
      }
    }

    loadUser()
  }, [supabase])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-40 flex items-center justify-between px-6">
      {/* Search bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Flow mode toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Flow Mode</span>
          <Switch checked={flowMode} onCheckedChange={setFlowMode} />
        </div>

        {/* Notifications - red dot indicates unread */}
        <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        {/* Voice input button */}
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
          <Mic className="h-5 w-5" />
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700">{name}</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
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
