'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useTheme } from 'next-themes'
import { Settings, Moon, Sun, Monitor, Loader2, Save, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ThemeSelector } from '@/components/theme-selector'
import { applyTheme, getSavedTheme, getThemeBaseId, type ThemeId } from '@/lib/theme-utils'
import { ExportDialog } from '@/components/export-import/export-dialog'

interface UserSettings {
  wake_time: string
  sleep_time: string
  work_hours_start: string
  work_hours_end: string
  full_name: string | null
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [currentTheme, setCurrentTheme] = useState<string>('default')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    wake_time: '07:00',
    sleep_time: '23:00',
    work_hours_start: '09:00',
    work_hours_end: '17:00',
    full_name: null,
  })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
    
    // Load and apply saved theme
    const saved = getSavedTheme()
    const savedThemeString = localStorage.getItem('app-theme') || 'default'
    setCurrentTheme(savedThemeString)
    
    // Apply theme on mount
    applyTheme(saved.themeId, saved.mode)
    setTheme(saved.mode)
  }, [])

  const handleThemeChange = (themeId: string) => {
    const baseId = getThemeBaseId(themeId) as ThemeId
    const currentMode = theme === 'dark' ? 'dark' : 'light'
    
    // Apply the theme
    applyTheme(baseId, currentMode)
    setTheme(currentMode)
    setCurrentTheme(themeId)
    
    toast({
      title: 'Theme Updated',
      description: `Switched to ${baseId} theme`,
    })
  }

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        const settingsData = data as any
        setSettings({
          wake_time: settingsData.wake_time || '07:00',
          sleep_time: settingsData.sleep_time || '23:00',
          work_hours_start: settingsData.work_hours_start || '09:00',
          work_hours_end: settingsData.work_hours_end || '17:00',
          full_name: settingsData.full_name,
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await (supabase
        .from('users') as any)
        .update(settings)
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and account settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the app appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Theme Selection</Label>
              <ThemeSelector
                currentTheme={currentTheme}
                onThemeChange={handleThemeChange}
              />
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <Label>Color Mode</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const baseId = getThemeBaseId(currentTheme) as ThemeId
                    setTheme('light')
                    applyTheme(baseId, 'light')
                  }}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const baseId = getThemeBaseId(currentTheme) as ThemeId
                    setTheme('dark')
                    applyTheme(baseId, 'dark')
                  }}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Preferences</CardTitle>
            <CardDescription>
              Set your daily schedule preferences for AI planning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wake_time">Wake Time</Label>
                <Input
                  id="wake_time"
                  type="time"
                  value={settings.wake_time}
                  onChange={(e) =>
                    setSettings({ ...settings, wake_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleep_time">Sleep Time</Label>
                <Input
                  id="sleep_time"
                  type="time"
                  value={settings.sleep_time}
                  onChange={(e) =>
                    setSettings({ ...settings, sleep_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_start">Work Start</Label>
                <Input
                  id="work_start"
                  type="time"
                  value={settings.work_hours_start}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      work_hours_start: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_end">Work End</Label>
                <Input
                  id="work_end"
                  type="time"
                  value={settings.work_hours_end}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      work_hours_end: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={settings.full_name || ''}
                onChange={(e) =>
                  setSettings({ ...settings, full_name: e.target.value })
                }
                placeholder="Your name"
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Manage task reminders and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/notifications">
              <Button variant="outline" className="w-full">
                Configure Notifications
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Export or import your data for backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExportDialog />
            <p className="text-sm text-muted-foreground">
              Export all your tasks, habits, notes, and certifications as JSON or CSV.
            </p>
          </CardContent>
        </Card>

        <Card className="glow-card hover-lift">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your profile and account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/profile">
              <Button variant="outline" className="w-full shimmer-button">
                <User className="mr-2 h-4 w-4" />
                View Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

