'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Calendar,
  Heart,
  Brain,
  Clock,
  Link2,
  Target,
  Settings,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Navigation structure - keeping these as constants makes it easier to maintain
// Could move to a config file, but keeping here for now (legacy decision)
const primaryNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/notes', label: 'Notes', icon: FileText },
  { href: '/dashboard/planner', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/planner/timetable', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/habits', label: 'Habits', icon: Heart },
]

const arcanaToolsNav = [
  { href: '/dashboard/chat', label: 'AI Assistant', icon: Brain },
  { href: '/dashboard/coach', label: 'Time Warp', icon: Clock },
  { href: '/dashboard/projects', label: 'Arcana Connect', icon: Link2 },
  { href: '/dashboard/planner/focus', label: 'Flow Mode', icon: Target },
]

// Sidebar navigation component
// Fixed width (256px = w-64) - this is intentional, not responsive
// Trade-off: mobile users get a drawer overlay instead (handled elsewhere)
export function Sidebar() {
  const currentPath = usePathname()

  // Active state detection - handles exact matches and sub-routes
  // The dashboard root needs special handling to avoid false positives
  const checkIfActive = (navHref: string) => {
    if (navHref === '/dashboard') {
      return currentPath === '/dashboard'
    }
    // For sub-routes, check if pathname starts with the href
    return currentPath?.startsWith(navHref) ?? false
  }

  // Render a single nav item
  // Extracted to reduce repetition but kept simple (not over-engineered)
  const renderNavItem = (item: typeof primaryNavItems[0]) => {
    const IconComponent = item.icon
    const isCurrentlyActive = checkIfActive(item.href)
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          // Active state uses purple - Arcana brand color
          // The purple-100 is slightly lighter than typical for better contrast
          isCurrentlyActive
            ? 'bg-purple-100 text-purple-700'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <IconComponent className="h-5 w-5 flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-30">
      {/* Arcana branding header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="text-2xl font-bold bg-gradient-to-r from-[#2A2D7C] to-[#9C6ADE] bg-clip-text text-transparent">
          Arcana
        </div>
      </div>

      {/* Scrollable navigation area */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Primary navigation section */}
        <div className="px-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            MAIN
          </h3>
          <nav className="space-y-1">
            {primaryNavItems.map(renderNavItem)}
          </nav>
        </div>

        {/* Arcana tools section */}
        <div className="px-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            TOOLS
          </h3>
          <nav className="space-y-1">
            {arcanaToolsNav.map(renderNavItem)}
          </nav>
        </div>
      </div>

      {/* Bottom section - settings and help */}
      {/* Using border-t instead of absolute positioning - simpler and more reliable */}
      <div className="border-t border-gray-200 p-4 space-y-1 flex-shrink-0">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            currentPath?.startsWith('/dashboard/settings')
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span>Settings</span>
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <HelpCircle className="h-5 w-5 flex-shrink-0" />
          <span>Help & Support</span>
        </Link>
      </div>
    </div>
  )
}
