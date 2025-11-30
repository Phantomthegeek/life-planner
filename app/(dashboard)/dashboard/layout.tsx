import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/dashboard/navbar'
import { Toaster } from '@/components/ui/toaster'
import { CommandPalette } from '@/components/command-palette'
import { DashboardLayoutClient } from './layout-client'
import { KeyboardShortcutsProvider } from '@/components/dashboard/keyboard-shortcuts-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden animated-dots">
      <div className="absolute inset-0 vibrant-bg opacity-30 pointer-events-none" />
      <Navbar />
      <main className="container mx-auto py-4 md:py-8 px-2 md:px-4 max-w-7xl relative z-10">
        <div className="fade-in">{children}</div>
      </main>
      <Toaster />
      <CommandPalette />
      <DashboardLayoutClient />
      <KeyboardShortcutsProvider />
    </div>
  )
}

