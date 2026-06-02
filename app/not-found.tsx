import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Compass } from 'lucide-react'

// Standard 404 — kept short and on-brand so it doesn't feel like the user
// hit a dead system page. Links back to the dashboard rather than guessing
// at intent.
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-muted text-muted-foreground">
          <Compass className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          That page doesn&apos;t exist
        </h1>
        <p className="text-sm text-muted-foreground">
          The link may be wrong or the page may have moved.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button asChild variant="default">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
