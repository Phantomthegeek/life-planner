'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

// Catches any unhandled error thrown by a page or layout during render. Next
// shows this in place of the failed page. Kept minimal: branded heading, an
// honest message, and two escape hatches (retry + back to the dashboard).
//
// We log to console so the error surfaces in Vercel/browser devtools — that's
// the only place a user-facing error would otherwise vanish silently.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground">
          That page hit an unexpected error. Try again, and if it keeps
          happening, head back to the dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/70 font-mono">
            ref: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
