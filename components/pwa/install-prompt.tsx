'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, X, CheckCircle2 } from 'lucide-react'
import { usePwaInstall } from '@/hooks/use-pwa-install'

const DISMISS_KEY = 'pwa-install-dismissed'
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000
const SHOW_DELAY_MS = 5000

// Auto-prompt that runs once per visit on browsers that support a native
// install prompt. Users who don't see this can still install via the
// "Install app" button in Settings / the avatar menu (see InstallButton).
export function InstallPrompt() {
  const { canPrompt, isInstalled, promptInstall } = usePwaInstall()
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (!canPrompt || isInstalled) {
      setShowPrompt(false)
      return
    }
    // Respect a 7-day cooldown when the user dismissed it previously.
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return

    const timer = setTimeout(() => setShowPrompt(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [canPrompt, isInstalled])

  const handleInstall = async () => {
    const accepted = await promptInstall()
    setShowPrompt(false)
    if (!accepted) {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } else {
      localStorage.removeItem(DISMISS_KEY)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Install Arcana</DialogTitle>
          <DialogDescription className="pt-2">
            Add Arcana to your home screen for faster access and offline support.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Launches from your home screen</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Works offline</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Faster load times</span>
            </li>
          </ul>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleInstall} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Install
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Not now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
