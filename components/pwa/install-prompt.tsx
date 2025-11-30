'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, X, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show prompt after a delay if user hasn't dismissed it
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if app was just installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowPrompt(false)
      localStorage.removeItem('pwa-install-dismissed')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
      setDeferredPrompt(null)
    } else {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    setShowPrompt(false)
    // Show again after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed')
    }, 7 * 24 * 60 * 60 * 1000)
  }

  if (isInstalled || !deferredPrompt || !showPrompt) return null

  return (
    <AnimatePresence>
      {showPrompt && (
        <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
          <DialogContent className="sm:max-w-md glow-card border-2 max-h-[90vh] overflow-y-auto install-prompt-center">
            <DialogHeader>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-3 mb-2"
              >
                <div className="p-2 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-xl font-bold gradient-text">
                  Install Little Einstein
                </DialogTitle>
              </motion.div>
              <DialogDescription className="text-base pt-2">
                Install our app for a better experience! Get quick access, offline support, and
                a native app feel.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Quick access from your home screen</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Works offline</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Faster loading times</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Native app experience</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleInstall}
                  className="flex-1 shimmer-button"
                  size="lg"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Install Now
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Maybe Later
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

