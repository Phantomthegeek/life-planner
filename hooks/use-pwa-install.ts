'use client'

import { useCallback, useEffect, useState } from 'react'

// `beforeinstallprompt` isn't in the standard DOM lib but is well-supported on
// Chromium browsers. We use a narrow interface rather than `any`.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// The prompt can only be triggered once per page-load when it fires, and only
// inside a user gesture handler. We stash the event on `window` so any
// consumer of this hook can grab it — otherwise whichever component mounts
// first wins and everyone else gets `null` forever.
interface InstallWindow extends Window {
  __arcanaDeferredInstallPrompt?: BeforeInstallPromptEvent | null
}

export type InstallPlatform =
  | 'chromium' // Chrome, Edge, Brave, Samsung Internet, Opera — fires beforeinstallprompt
  | 'ios-safari' // iPhone / iPad Safari — manual "Add to Home Screen"
  | 'macos-safari' // Desktop Safari — manual "Add to Dock" (Safari 17+)
  | 'firefox' // Firefox desktop has no install; Android has manual menu
  | 'unsupported'

function detectPlatform(): InstallPlatform {
  if (typeof window === 'undefined') return 'unsupported'
  const ua = window.navigator.userAgent

  // iPadOS reports as Mac, so check touch points too.
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Mac') && 'ontouchend' in document)

  if (isIos) return 'ios-safari'

  // Safari on macOS: has "Safari" and "Version/" but not "Chrome", "Chromium",
  // "Edg", "OPR", or "SamsungBrowser".
  const isSafariDesktop =
    ua.includes('Safari/') &&
    ua.includes('Version/') &&
    !/Chrome|Chromium|Edg|OPR|SamsungBrowser/.test(ua)
  if (isSafariDesktop) return 'macos-safari'

  if (/Firefox\//.test(ua)) return 'firefox'

  // Chromium family — including Edge, Brave, Opera, Samsung Internet.
  if (/Chrome|Chromium|Edg|OPR|SamsungBrowser/.test(ua)) return 'chromium'

  return 'unsupported'
}

function checkInstalled(): boolean {
  if (typeof window === 'undefined') return false
  // Standalone PWA display modes across vendors.
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return true
  // iOS Safari uses a non-standard `navigator.standalone`.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean })
    .standalone
  if (iosStandalone === true) return true
  return false
}

export interface UsePwaInstall {
  // True when the browser has handed us a deferred prompt that we can fire.
  canPrompt: boolean
  // True when the app is currently running in standalone / installed mode.
  isInstalled: boolean
  // Best-effort detection of the user's browser+OS combo.
  platform: InstallPlatform
  // Fire the saved deferred prompt. No-op on browsers that don't support it.
  // Returns true if the user accepted the install.
  promptInstall: () => Promise<boolean>
}

export function usePwaInstall(): UsePwaInstall {
  const [canPrompt, setCanPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform, setPlatform] = useState<InstallPlatform>('unsupported')

  useEffect(() => {
    setPlatform(detectPlatform())
    setIsInstalled(checkInstalled())

    const win = window as InstallWindow
    // If something else (e.g. the auto-prompt) already captured the event
    // before this hook mounted, pick it up.
    if (win.__arcanaDeferredInstallPrompt) {
      setCanPrompt(true)
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      win.__arcanaDeferredInstallPrompt = event as BeforeInstallPromptEvent
      setCanPrompt(true)
    }

    const onInstalled = () => {
      win.__arcanaDeferredInstallPrompt = null
      setCanPrompt(false)
      setIsInstalled(true)
    }

    // Display-mode can change mid-session (rare, but happens when the user
    // installs via the browser address-bar icon).
    const standaloneMql = window.matchMedia('(display-mode: standalone)')
    const onStandaloneChange = () => setIsInstalled(checkInstalled())

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    standaloneMql.addEventListener('change', onStandaloneChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      standaloneMql.removeEventListener('change', onStandaloneChange)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    const win = window as InstallWindow
    const event = win.__arcanaDeferredInstallPrompt
    if (!event) return false
    try {
      await event.prompt()
      const result = await event.userChoice
      // The same event can't be used twice — clear it either way.
      win.__arcanaDeferredInstallPrompt = null
      setCanPrompt(false)
      return result.outcome === 'accepted'
    } catch {
      return false
    }
  }, [])

  return { canPrompt, isInstalled, platform, promptInstall }
}
