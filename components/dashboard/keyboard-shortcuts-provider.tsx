'use client'

import { useGlobalKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { KeyboardShortcutsHelp } from '@/components/keyboard-shortcuts-help'
import { useState, useEffect } from 'react'

export function KeyboardShortcutsProvider() {
  const [helpOpen, setHelpOpen] = useState(false)
  
  // Set up global shortcuts
  useGlobalKeyboardShortcuts()

  // Show help dialog on ? key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      if (e.key === '?') {
        e.preventDefault()
        setHelpOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <KeyboardShortcutsHelp
      open={helpOpen}
      onOpenChange={setHelpOpen}
      shortcuts={[
        {
          key: 'k',
          ctrl: true,
          action: () => {},
          description: 'Open command palette',
          category: 'Navigation',
        },
        {
          key: 'p',
          ctrl: true,
          action: () => {},
          description: 'Go to planner',
          category: 'Navigation',
        },
        {
          key: 'c',
          ctrl: true,
          action: () => {},
          description: 'Go to certifications',
          category: 'Navigation',
        },
        {
          key: 'h',
          ctrl: true,
          action: () => {},
          description: 'Go to habits',
          category: 'Navigation',
        },
        {
          key: 's',
          ctrl: true,
          action: () => {},
          description: 'Go to statistics',
          category: 'Navigation',
        },
        {
          key: 'n',
          ctrl: true,
          shift: true,
          action: () => {},
          description: 'New note',
          category: 'Quick Actions',
        },
        {
          key: 't',
          ctrl: true,
          shift: true,
          action: () => {},
          description: 'New task',
          category: 'Quick Actions',
        },
        {
          key: '?',
          action: () => {},
          description: 'Show keyboard shortcuts',
          category: 'Help',
        },
      ]}
    />
  )
}

