'use client'

import { useState } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, CheckCircle2, Share, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePwaInstall, type InstallPlatform } from '@/hooks/use-pwa-install'
import { cn } from '@/lib/utils'

interface InstallButtonProps extends Omit<ButtonProps, 'onClick'> {
  // Hide the button when the app is already running standalone. Default true.
  hideWhenInstalled?: boolean
  // Override the label. Defaults to "Install app".
  label?: string
  // When the platform can't show a native prompt, opening the instructions
  // dialog is the next-best thing. Set false to hide the button entirely on
  // those platforms.
  showInstructionsFallback?: boolean
}

// A single install entry point that does the right thing on every platform.
// On Chromium: triggers the saved beforeinstallprompt event.
// On Safari (iOS / macOS): opens a dialog with manual "Add to Home Screen"
// instructions, because Safari has no install API.
// On Firefox / unsupported: opens the same dialog with a "not available" note.
export function InstallButton({
  hideWhenInstalled = true,
  label = 'Install app',
  showInstructionsFallback = true,
  className,
  ...buttonProps
}: InstallButtonProps) {
  const { canPrompt, isInstalled, platform, promptInstall } = usePwaInstall()
  const { toast } = useToast()
  const [instructionsOpen, setInstructionsOpen] = useState(false)

  if (hideWhenInstalled && isInstalled) return null

  // If the browser can't install at all and we're not allowed to show the
  // fallback, render nothing rather than a button that does nothing.
  const needsInstructions = !canPrompt
  if (needsInstructions && !showInstructionsFallback) return null

  const handleClick = async () => {
    if (canPrompt) {
      const accepted = await promptInstall()
      if (accepted) {
        toast({
          title: 'Installing Arcana',
          description: 'You can launch it from your home screen or app launcher.',
        })
      }
      return
    }
    setInstructionsOpen(true)
  }

  return (
    <>
      <Button
        {...buttonProps}
        onClick={handleClick}
        className={cn(className)}
      >
        <Download className="mr-2 h-4 w-4" />
        {label}
      </Button>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install Arcana</DialogTitle>
            <DialogDescription>
              How to add Arcana to your device for offline use and a faster launch.
            </DialogDescription>
          </DialogHeader>
          <InstructionsBody platform={platform} />
        </DialogContent>
      </Dialog>
    </>
  )
}

function InstructionsBody({ platform }: { platform: InstallPlatform }) {
  if (platform === 'ios-safari') {
    return (
      <ol className="space-y-3 text-sm pt-2">
        <Step number={1}>
          Tap the <Share className="inline h-4 w-4 mx-1 align-text-bottom" />{' '}
          <strong>Share</strong> button at the bottom of Safari.
        </Step>
        <Step number={2}>
          Scroll down and tap{' '}
          <strong>
            Add to Home Screen
            <Plus className="inline h-4 w-4 ml-1 align-text-bottom" />
          </strong>
          .
        </Step>
        <Step number={3}>
          Tap <strong>Add</strong> in the top right. Arcana will appear on your home screen like a native app.
        </Step>
      </ol>
    )
  }

  if (platform === 'macos-safari') {
    return (
      <div className="space-y-3 text-sm pt-2">
        <ol className="space-y-3">
          <Step number={1}>
            From Safari&apos;s menu bar, open <strong>File → Add to Dock…</strong>{' '}
            <span className="text-muted-foreground">(Safari 17 or newer)</span>.
          </Step>
          <Step number={2}>
            Confirm the name and click <strong>Add</strong>. Arcana will live in your Dock as its own app.
          </Step>
        </ol>
        <p className="text-xs text-muted-foreground border-t pt-3">
          On older Safari versions this option isn&apos;t available — use Chrome,
          Edge, or Brave for a one-click install instead.
        </p>
      </div>
    )
  }

  if (platform === 'firefox') {
    return (
      <div className="space-y-3 text-sm pt-2">
        <p>
          Firefox doesn&apos;t support installing web apps the way other browsers
          do.
        </p>
        <p className="text-muted-foreground">
          For the best experience, open Arcana in{' '}
          <strong>Chrome, Edge, Brave</strong>, or on iPhone in <strong>Safari</strong>,
          then look for the install option in the address bar or share menu.
        </p>
        <p className="text-xs text-muted-foreground border-t pt-3">
          On Firefox for Android: open the browser menu and tap{' '}
          <strong>Install</strong> or <strong>Add to Home Screen</strong>.
        </p>
      </div>
    )
  }

  if (platform === 'chromium') {
    return (
      <div className="space-y-3 text-sm pt-2">
        <p>
          Your browser hasn&apos;t offered an install prompt yet. This usually
          means one of:
        </p>
        <ul className="space-y-2 pl-1">
          <Bullet>You&apos;ve already installed Arcana on this device.</Bullet>
          <Bullet>You dismissed the install prompt earlier — clear your site data and reload.</Bullet>
          <Bullet>
            Look for an install icon{' '}
            <Download className="inline h-3.5 w-3.5 mx-0.5 align-text-bottom" />{' '}
            at the right end of the address bar, or open the browser menu and
            choose <strong>Install Arcana</strong>.
          </Bullet>
        </ul>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm pt-2">
      <p>
        We couldn&apos;t detect a supported install method for this browser.
      </p>
      <p className="text-muted-foreground">
        Arcana can be installed from <strong>Chrome, Edge, Brave</strong>, or on
        iPhone/iPad from <strong>Safari</strong> via Share → Add to Home Screen.
      </p>
    </div>
  )
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
        {number}
      </span>
      <div className="flex-1 pt-0.5 leading-relaxed">{children}</div>
    </li>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  )
}
