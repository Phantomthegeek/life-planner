'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  BookOpen,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Navigation structure - keeping these as constants makes it easier to maintain
const primaryNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/notes', label: 'Notes', icon: FileText },
  { href: '/dashboard/planner', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/planner/timetable', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/certifications', label: 'Courses', icon: BookOpen },
  { href: '/dashboard/habits', label: 'Habits', icon: Heart },
]

const arcanaToolsNav = [
  { href: '/dashboard/chat', label: 'AI Assistant', icon: Brain },
  { href: '/dashboard/coach', label: 'Time Warp', icon: Clock },
  { href: '/dashboard/projects', label: 'Arcana Connect', icon: Link2 },
  { href: '/dashboard/planner/focus', label: 'Flow Mode', icon: Target },
]

// Sidebar navigation component
// Mobile: drawer overlay, Desktop: fixed sidebar
export function Sidebar() {
  const currentPath = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Active state detection
  const checkIfActive = (navHref: string) => {
    if (navHref === '/dashboard') {
      return currentPath === '/dashboard'
    }
    return currentPath?.startsWith(navHref) ?? false
  }

  // Render a single nav item
  const renderNavItem = (item: typeof primaryNavItems[0]) => {
    const IconComponent = item.icon
    const isCurrentlyActive = checkIfActive(item.href)
    
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)} // Close mobile menu on click
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isCurrentlyActive
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
      >
        <IconComponent className="h-5 w-5 flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <>
      {/* Mobile menu button - fixed top left */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - mobile drawer / desktop fixed */}
      <div
        className={cn(
          'w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen fixed left-0 top-0 flex flex-col z-30 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Arcana branding header */}
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#2A2D7C] to-[#9C6ADE] bg-clip-text text-transparent">
            Arcana
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable navigation area */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Primary navigation section */}
          <div className="px-4 mb-6">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
              MAIN
            </h3>
            <nav className="space-y-1">
              {primaryNavItems.map(renderNavItem)}
            </nav>
          </div>

          {/* Arcana tools section */}
          <div className="px-4 mb-6">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
              TOOLS
            </h3>
            <nav className="space-y-1">
              {arcanaToolsNav.map((item) => {
                const IconComponent = item.icon
                const isActive = checkIfActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <IconComponent className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Bottom section - settings and help */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-1 flex-shrink-0">
          <Link
            href="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              currentPath?.startsWith('/dashboard/settings')
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            <span>Settings</span>
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <HelpCircle className="h-5 w-5 flex-shrink-0" />
            <span>Help & Support</span>
          </Link>
        </div>
      </div>
    </>
  )
}
