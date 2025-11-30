'use client'

import { useEffect } from 'react'
import { getSavedTheme, applyTheme } from '@/lib/theme-utils'

export function ThemeInit() {
  useEffect(() => {
    // Apply saved theme on mount (runs before hydration to prevent flash)
    const saved = getSavedTheme()
    const html = document.documentElement
    
    // Apply the saved theme
    applyTheme(saved.themeId, saved.mode)
    
    // Also set the dark class for next-themes
    if (saved.mode === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }, [])

  return null
}

