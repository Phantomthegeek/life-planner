'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Sun, Moon, Monitor, Loader2, Save, Bell, Upload, Trash2, Smartphone } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { ThemeSelector } from '@/components/theme-selector'
import { applyTheme, getSavedTheme, getThemeBaseId, type ThemeId } from '@/lib/theme-utils'
import { ExportDialog } from '@/components/export-import/export-dialog'
import { InstallButton } from '@/components/pwa/install-button'
import { usePwaInstall } from '@/hooks/use-pwa-install'

// Only the fields that the rest of the app actually reads. wake/sleep/work
// hours feed the AI coach; full_name shows up in greetings.
interface ProfileSettings {
  full_name: string | null
  wake_time: string
  sleep_time: string
  work_hours_start: string
  work_hours_end: string
}

const DEFAULT_SETTINGS: ProfileSettings = {
  full_name: null,
  wake_time: '07:00',
  sleep_time: '23:00',
  work_hours_start: '09:00',
  work_hours_end: '17:00',
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { isInstalled, platform } = usePwaInstall()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<string>('default')
  const [settings, setSettings] = useState<ProfileSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    const saved = getSavedTheme()
    setCurrentTheme(localStorage.getItem('app-theme') || 'default')
    applyTheme(saved.themeId, saved.mode)
    setTheme(saved.mode)

    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The header dropdown deep-links to #install. Scroll the card into view.
  useEffect(() => {
    if (loading) return
    if (typeof window === 'undefined') return
    if (window.location.hash !== '#install') return
    const el = document.getElementById('install')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loading])

  const fetchSettings = async () => {
    const supabase = createClient()
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('users')
        .select('full_name, wake_time, sleep_time, work_hours_start, work_hours_end, email')
        .eq('id', user.id)
        .single()

      // PGRST116 = row not found; we'll create one on save.
      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setSettings({
          full_name: data.full_name,
          wake_time: data.wake_time || DEFAULT_SETTINGS.wake_time,
          sleep_time: data.sleep_time || DEFAULT_SETTINGS.sleep_time,
          work_hours_start: data.work_hours_start || DEFAULT_SETTINGS.work_hours_start,
          work_hours_end: data.work_hours_end || DEFAULT_SETTINGS.work_hours_end,
        })
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upsert handles both first-save (no row yet) and subsequent updates.
      const { error } = await supabase.from('users').upsert(
        {
          id: user.id,
          email: user.email || '',
          full_name: settings.full_name?.trim() || null,
          wake_time: settings.wake_time,
          sleep_time: settings.sleep_time,
          work_hours_start: settings.work_hours_start,
          work_hours_end: settings.work_hours_end,
        },
        { onConflict: 'id' }
      )
      if (error) throw error

      toast({ title: 'Saved', description: 'Your preferences are up to date.' })
    } catch (err: any) {
      toast({
        title: 'Could not save',
        description: err?.message || 'Something went wrong.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleThemeChange = (themeId: string) => {
    const baseId = getThemeBaseId(themeId) as ThemeId
    const mode = theme === 'dark' ? 'dark' : 'light'
    applyTheme(baseId, mode)
    setTheme(mode)
    setCurrentTheme(themeId)
  }

  const setColorMode = (mode: 'light' | 'dark' | 'system') => {
    const baseId = getThemeBaseId(currentTheme) as ThemeId
    setTheme(mode)
    if (mode !== 'system') applyTheme(baseId, mode)
  }

  const clearLocalCache = () => {
    // Preserve auth + theme so the user doesn't get bounced to login or flashed
    // back to a default theme they didn't pick.
    const preserve = ['app-theme', 'app-theme-mode']
    const kept: Record<string, string> = {}
    for (const key of preserve) {
      const v = localStorage.getItem(key)
      if (v !== null) kept[key] = v
    }
    // Keep Supabase auth cookies/keys
    const allKeys = Object.keys(localStorage)
    for (const key of allKeys) {
      if (key.startsWith('sb-')) {
        const v = localStorage.getItem(key)
        if (v !== null) kept[key] = v
      }
    }
    localStorage.clear()
    for (const [k, v] of Object.entries(kept)) localStorage.setItem(k, v)
    toast({
      title: 'Local cache cleared',
      description: 'Refresh the page to start fresh.',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Preferences that actually do something. Save when you&apos;re done.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save changes
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>
            How Arcana addresses you. Used in greetings and AI prompts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="full_name">Display name</Label>
            <Input
              id="full_name"
              value={settings.full_name || ''}
              onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
              placeholder="e.g. Alex Morgan"
            />
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/settings/profile">Edit full profile</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily schedule</CardTitle>
          <CardDescription>
            The AI coach plans your day around these hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="wake_time">Wake</Label>
              <Input
                id="wake_time"
                type="time"
                value={settings.wake_time}
                onChange={(e) => setSettings({ ...settings, wake_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleep_time">Sleep</Label>
              <Input
                id="sleep_time"
                type="time"
                value={settings.sleep_time}
                onChange={(e) => setSettings({ ...settings, sleep_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_start">Work start</Label>
              <Input
                id="work_start"
                type="time"
                value={settings.work_hours_start}
                onChange={(e) =>
                  setSettings({ ...settings, work_hours_start: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_end">Work end</Label>
              <Input
                id="work_end"
                type="time"
                value={settings.work_hours_end}
                onChange={(e) =>
                  setSettings({ ...settings, work_hours_end: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
          <CardDescription>Theme and light/dark mode.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ThemeSelector currentTheme={currentTheme} onThemeChange={handleThemeChange} />

          <Separator />

          <div>
            <Label className="block mb-2 text-sm font-medium">Mode</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setColorMode('light')}
              >
                <Sun className="mr-2 h-3.5 w-3.5" /> Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setColorMode('dark')}
              >
                <Moon className="mr-2 h-3.5 w-3.5" /> Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setColorMode('system')}
              >
                <Monitor className="mr-2 h-3.5 w-3.5" /> System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </CardTitle>
          <CardDescription>
            Browser reminders for upcoming tasks. Managed on its own page so the
            permission flow stays clean.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings/notifications">Open notification settings</Link>
          </Button>
        </CardContent>
      </Card>

      <Card id="install" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="h-4 w-4" /> Install app
          </CardTitle>
          <CardDescription>
            Add Arcana to your home screen or dock so it launches like a native
            app and works offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isInstalled ? (
            <p className="text-sm text-muted-foreground">
              Arcana is already installed on this device. Launch it from your
              home screen or app launcher.
            </p>
          ) : (
            <>
              <InstallButton
                variant="default"
                size="default"
                label={
                  platform === 'ios-safari' || platform === 'macos-safari'
                    ? 'Show install instructions'
                    : 'Install Arcana'
                }
              />
              <p className="text-xs text-muted-foreground">
                {platform === 'ios-safari' &&
                  'Safari doesn\u2019t have a one-tap install, so we\u2019ll walk you through Share \u2192 Add to Home Screen.'}
                {platform === 'macos-safari' &&
                  'Safari 17+ supports Add to Dock from the File menu \u2014 click above for the exact steps.'}
                {platform === 'chromium' &&
                  'On Chrome, Edge or Brave, this triggers the browser\u2019s install prompt. If nothing happens, look for an install icon in the address bar.'}
                {platform === 'firefox' &&
                  'Firefox doesn\u2019t support installing web apps the same way \u2014 we\u2019ll show what to try instead.'}
                {platform === 'unsupported' &&
                  'Open Arcana in Chrome, Edge, Brave, or Safari to install it.'}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your data</CardTitle>
          <CardDescription>Export, import, or wipe local cache.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <ExportDialog />
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings/data">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Export everything — tasks, habits, notes, courses — as JSON or CSV.
          </p>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Danger zone</CardTitle>
          <CardDescription>Things you usually don&apos;t want to undo.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear local cache
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear local cache?</AlertDialogTitle>
                <AlertDialogDescription>
                  Wipes locally stored preferences (templates, gamification XP, dismissed nudges).
                  Your account, tasks, and notes on the server stay untouched. You&apos;ll stay
                  signed in.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearLocalCache}>Clear</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
