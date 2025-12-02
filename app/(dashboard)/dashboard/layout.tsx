import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="pt-16 p-6">
          {children}
        </main>
      </div>
      <Toaster />
      <CommandPalette />
      <DashboardLayoutClient />
      <KeyboardShortcutsProvider />
    </div>
  )
}

