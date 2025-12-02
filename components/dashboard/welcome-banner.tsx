'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Sparkles, Sun, Moon, Sunset } from 'lucide-react'

// Arcana greeting system - handles time-based personalization
// Note: We cache the greeting calculation to avoid re-renders on every hour change
// This is a bit of a legacy pattern but prevents unnecessary state updates
export function WelcomeBanner() {
  const [arcanaUserName, setArcanaUserName] = useState<string | null>(null)
  const [timeBasedGreeting, setTimeBasedGreeting] = useState('Welcome')
  const supabase = createClient()

  useEffect(() => {
    // Fetch user profile data - we need the full_name from the users table
    // This always bites me - Supabase auth.user doesn't have full_name, gotta hit the users table
    const loadUserProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) return

        // Try users table first (most reliable source)
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', user.id)
          .single()

        if (profileError) {
          // If users table doesn't exist or query fails, fall back to email
          if (user.email) {
            const emailPrefix = user.email.split('@')[0]
            const capitalizedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
            setArcanaUserName(capitalizedName)
          }
          return
        }

        if (userProfile?.full_name) {
          // Extract first name only - keeps it personal but not overly familiar
          const firstName = userProfile.full_name.split(' ')[0]
          setArcanaUserName(firstName)
        } else if (user.email) {
          // Fallback: derive name from email prefix
          // This is a bit hacky but works for onboarding flow
          const emailPrefix = user.email.split('@')[0]
          const capitalizedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
          setArcanaUserName(capitalizedName)
        }
      } catch (err: any) {
        // Silently fail - banner just won't show if we can't get the name
        // Better than showing an error state for something non-critical
        if (err?.message?.includes('Missing Supabase') || err?.message?.includes('environment variables')) {
          console.warn('Supabase not configured')
        } else {
          console.error('Failed to load user profile for greeting:', err)
        }
      }
    }

    loadUserProfile()

    // Calculate time-based greeting
    // Using Date directly here instead of a library - keeps dependencies light
    // Trade-off: timezone handling is manual, but acceptable for this use case
    const currentHour = new Date().getHours()
    let greetingText = 'Welcome' // default fallback
    
    if (currentHour < 12) {
      greetingText = 'Good morning'
    } else if (currentHour < 17) {
      greetingText = 'Good afternoon'
    } else {
      greetingText = 'Good evening'
    }
    
    setTimeBasedGreeting(greetingText)
  }, [supabase])

  // Icon selection based on time of day
  // Keeping this separate function - could inline but makes testing easier
  const renderTimeIcon = () => {
    const hourOfDay = new Date().getHours()
    
    if (hourOfDay < 12) {
      return <Sun className="h-5 w-5 text-yellow-500" />
    } else if (hourOfDay < 17) {
      return <Sunset className="h-5 w-5 text-orange-500" />
    } else {
      return <Moon className="h-5 w-5 text-blue-500" />
    }
  }

  // Don't render if we don't have a name - avoids awkward "Welcome, !" states
  if (!arcanaUserName) {
    return null
  }

  // Arcana brand colors with intentional opacity variation
  // The /10 opacity is slightly lighter than typical - gives it a softer feel
  // Manual adjustment: border is /20 to create subtle depth without being heavy
  return (
    <Card className="bg-gradient-to-r from-[#2A2D7C]/10 via-[#9C6ADE]/10 to-[#00C1B3]/10 border-2 border-[#2A2D7C]/20 p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Icon container - fixed size prevents layout shift */}
        <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#2A2D7C] to-[#9C6ADE] text-white flex-shrink-0">
          {renderTimeIcon()}
        </div>
        
        {/* Text content - flex-1 allows it to take remaining space */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {timeBasedGreeting}, {arcanaUserName}!
          </h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Ready to make today productive? Let&apos;s get started.
          </p>
        </div>
        
        {/* Decorative element - hidden on mobile to save space */}
        <div className="hidden md:block flex-shrink-0">
          <Sparkles className="h-8 w-8 text-[#9C6ADE] animate-pulse" />
        </div>
      </div>
    </Card>
  )
}
