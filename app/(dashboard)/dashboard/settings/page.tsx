'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor, 
  Loader2, 
  Save, 
  User,
  Bell,
  Brain,
  Shield,
  Keyboard,
  Globe,
  Zap,
  Database,
  Mail,
  Clock,
  Palette,
  Volume2,
  Eye,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ThemeSelector } from '@/components/theme-selector'
import { applyTheme, getSavedTheme, getThemeBaseId, type ThemeId } from '@/lib/theme-utils'
import { ExportDialog } from '@/components/export-import/export-dialog'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

interface UserSettings {
  wake_time: string
  sleep_time: string
  work_hours_start: string
  work_hours_end: string
  full_name: string | null
  // New settings
  notifications_enabled: boolean
  email_notifications: boolean
  task_reminders: boolean
  habit_reminders: boolean
  ai_model: string
  ai_temperature: number
  auto_save: boolean
  compact_mode: boolean
  sound_enabled: boolean
  language: string
  timezone: string
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [currentTheme, setCurrentTheme] = useState<string>('default')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('appearance')
  const [settings, setSettings] = useState<UserSettings>({
    wake_time: '07:00',
    sleep_time: '23:00',
    work_hours_start: '09:00',
    work_hours_end: '17:00',
    full_name: null,
    notifications_enabled: true,
    email_notifications: true,
    task_reminders: true,
    habit_reminders: true,
    ai_model: 'gpt-4',
    ai_temperature: 0.7,
    auto_save: true,
    compact_mode: false,
    sound_enabled: true,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

    // Load additional settings from localStorage
    const storedSettings = localStorage.getItem('arcana_settings')
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error('Failed to parse stored settings', e)
      }
    }
  }, [])

  const handleThemeChange = (themeId: string) => {
    const baseId = getThemeBaseId(themeId) as ThemeId
    const currentMode = theme === 'dark' ? 'dark' : 'light'
    
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
        setSettings(prev => ({
          ...prev,
          wake_time: settingsData.wake_time || '07:00',
          sleep_time: settingsData.sleep_time || '23:00',
          work_hours_start: settingsData.work_hours_start || '09:00',
          work_hours_end: settingsData.work_hours_end || '17:00',
          full_name: settingsData.full_name,
        }))
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Save to database
      const { error } = await supabase
        .from('users')
        .update({
          wake_time: settings.wake_time,
          sleep_time: settings.sleep_time,
          work_hours_start: settings.work_hours_start,
          work_hours_end: settings.work_hours_end,
          full_name: settings.full_name,
        })
        .eq('id', user.id)

      if (error) throw error

      // Save additional settings to localStorage
      const settingsToStore = {
        notifications_enabled: settings.notifications_enabled,
        email_notifications: settings.email_notifications,
        task_reminders: settings.task_reminders,
        habit_reminders: settings.habit_reminders,
        ai_model: settings.ai_model,
        ai_temperature: settings.ai_temperature,
        auto_save: settings.auto_save,
        compact_mode: settings.compact_mode,
        sound_enabled: settings.sound_enabled,
        language: settings.language,
        timezone: settings.timezone,
      }
      localStorage.setItem('arcana_settings', JSON.stringify(settingsToStore))

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

  const handleClearData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Clear local storage
      localStorage.clear()
      
      toast({
        title: 'Data Cleared',
        description: 'Local data has been cleared. Please refresh the page.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear data',
        variant: 'destructive',
      })
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your preferences and customize your Arcana experience
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save All Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Zap className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme Selection
                </CardTitle>
                <CardDescription>Choose your visual theme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ThemeSelector
                  currentTheme={currentTheme}
                  onThemeChange={handleThemeChange}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Color Mode</CardTitle>
                <CardDescription>Light, dark, or system preference</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => {
                      const baseId = getThemeBaseId(currentTheme) as ThemeId
                      setTheme('light')
                      applyTheme(baseId, 'light')
                    }}
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light Mode
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => {
                      const baseId = getThemeBaseId(currentTheme) as ThemeId
                      setTheme('dark')
                      applyTheme(baseId, 'dark')
                    }}
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark Mode
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setTheme('system')}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    System Default
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Display Options</CardTitle>
                <CardDescription>Customize how content is displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compact-mode">Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduce spacing for more content
                    </p>
                  </div>
                  <Switch
                    id="compact-mode"
                    checked={settings.compact_mode}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, compact_mode: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sound">Sound Effects</Label>
                    <p className="text-sm text-muted-foreground">
                      Play sounds for actions
                    </p>
                  </div>
                  <Switch
                    id="sound"
                    checked={settings.sound_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, sound_enabled: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Control how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive browser notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, notifications_enabled: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, email_notifications: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about upcoming tasks
                    </p>
                  </div>
                  <Switch
                    checked={settings.task_reminders}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, task_reminders: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Habit Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Daily reminders for habit tracking
                    </p>
                  </div>
                  <Switch
                    checked={settings.habit_reminders}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, habit_reminders: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Reminder Timing
                </CardTitle>
                <CardDescription>When to send reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Reminder Time</Label>
                  <Input type="time" defaultValue="09:00" />
                  <p className="text-xs text-muted-foreground">
                    Default time for daily reminders
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Settings Tab */}
        <TabsContent value="ai" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Model Settings
                </CardTitle>
                <CardDescription>Configure Arcana AI behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-model">AI Model</Label>
                  <Select
                    value={settings.ai_model}
                    onValueChange={(value) =>
                      setSettings({ ...settings, ai_model: value })
                    }
                  >
                    <SelectTrigger id="ai-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Higher models are smarter but slower
                  </p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Creativity Level</Label>
                    <Badge variant="outline">{settings.ai_temperature}</Badge>
                  </div>
                  <Slider
                    value={[settings.ai_temperature]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, ai_temperature: value })
                    }
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lower = more consistent, Higher = more creative
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Preferences</CardTitle>
                <CardDescription>Customize AI responses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-save AI Conversations</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save chat history
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_save}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, auto_save: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Daily Schedule
                </CardTitle>
                <CardDescription>Set your daily routine preferences</CardDescription>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Localization
                </CardTitle>
                <CardDescription>Language and regional settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) =>
                      setSettings({ ...settings, language: value })
                    }
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) =>
                      setSettings({ ...settings, timezone: value })
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <Link href="/dashboard/settings/profile">
                  <Button variant="outline" className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    Edit Full Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>Control your data privacy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve Arcana with usage data
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Error Reporting</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically report errors
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Data Visibility
                </CardTitle>
                <CardDescription>Control what others can see</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    All your data is private by default. Only you can access your tasks, habits, and notes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>Export, import, or manage your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ExportDialog />
                <Separator />
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/settings/import">
                      <Upload className="mr-2 h-4 w-4" />
                      Import Data
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Export all your tasks, habits, notes, and certifications as JSON or CSV.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  Keyboard Shortcuts
                </CardTitle>
                <CardDescription>View available keyboard shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/settings/shortcuts">
                  <Button variant="outline" className="w-full">
                    <Keyboard className="mr-2 h-4 w-4" />
                    View Shortcuts
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Local Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear Local Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear all locally stored preferences and cache. Your account data will remain safe.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearData}>
                        Clear Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
