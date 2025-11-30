import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
  category?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        (target.closest('[role="textbox"]') && target.tagName !== 'BODY')
      ) {
        return
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = !shortcut.ctrl || (e.ctrlKey || e.metaKey) // Meta for Mac Cmd
        const shiftMatch = !shortcut.shift || e.shiftKey
        const altMatch = !shortcut.alt || e.altKey
        const keyMatch =
          shortcut.key.toLowerCase() === e.key.toLowerCase()

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault()
          shortcut.action()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Global keyboard shortcuts hook for common actions
export function useGlobalKeyboardShortcuts() {
  const router = useRouter()

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrl: true,
      action: () => {
        // Open command palette
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      },
      description: 'Open command palette',
      category: 'Navigation',
    },
    {
      key: 'n',
      ctrl: true,
      shift: true,
      action: () => router.push('/dashboard/notes'),
      description: 'New note',
      category: 'Quick Actions',
    },
    {
      key: 't',
      ctrl: true,
      shift: true,
      action: () => router.push('/dashboard/planner'),
      description: 'New task',
      category: 'Quick Actions',
    },
    {
      key: 'p',
      ctrl: true,
      action: () => router.push('/dashboard/planner'),
      description: 'Go to planner',
      category: 'Navigation',
    },
    {
      key: 'c',
      ctrl: true,
      action: () => router.push('/dashboard/certifications'),
      description: 'Go to certifications',
      category: 'Navigation',
    },
    {
      key: 'h',
      ctrl: true,
      action: () => router.push('/dashboard/habits'),
      description: 'Go to habits',
      category: 'Navigation',
    },
    {
      key: 's',
      ctrl: true,
      action: () => router.push('/dashboard/statistics'),
      description: 'Go to statistics',
      category: 'Navigation',
    },
    {
      key: '?',
      action: () => {
        // Show keyboard shortcuts help
        const helpModal = document.getElementById('keyboard-shortcuts-help')
        if (helpModal) {
          (helpModal as any).showModal?.()
        }
      },
      description: 'Show keyboard shortcuts',
      category: 'Help',
    },
  ]

  useKeyboardShortcuts(shortcuts)
}

