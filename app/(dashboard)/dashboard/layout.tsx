import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { Toaster } from '@/components/ui/toaster'
import { DashboardLayoutClient } from './layout-client'
import { KeyboardShortcutsProvider } from '@/components/dashboard/keyboard-shortcuts-provider'
import { FloatingActionButton } from '@/components/ui/floating-action-button'

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        {/* Header is fixed h-14 (3.5rem). We need that as a minimum, plus a
            little breathing room. Splitting horizontal / vertical padding so
            the `p-4` shorthand doesn't clobber `pt-*` — that's the bug that
            was causing the header to overlap content. */}
        <main className="pt-[4.5rem] px-4 pb-4 md:pt-20 md:px-6 md:pb-6">
          {children}
        </main>
      </div>
      <Toaster />
      <DashboardLayoutClient />
      <KeyboardShortcutsProvider />
      <FloatingActionButton />
    </div>
  )
}
