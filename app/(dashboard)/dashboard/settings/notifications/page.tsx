'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Bell, BellOff, Save, AlertCircle } from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import { useToast } from '@/hooks/use-toast'

export default function NotificationSettingsPage() {
  const { permission, requestPermission, isSupported } = useNotifications()
  const [enabled, setEnabled] = useState(true)
  const [minutesBefore, setMinutesBefore] = useState(15)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load saved settings from localStorage
    const savedEnabled = localStorage.getItem('notifications-enabled')
    const savedMinutes = localStorage.getItem('notifications-minutes-before')
    
    if (savedEnabled !== null) {
      setEnabled(savedEnabled === 'true')
    }
    if (savedMinutes) {
      setMinutesBefore(parseInt(savedMinutes))
    }
  }, [])

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (granted) {
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive task reminders.',
      })
    } else {
      toast({
        title: 'Permission Denied',
        description: 'Please enable notifications in your browser settings.',
        variant: 'destructive',
      })
    }
  }

  const handleSave = () => {
    setSaving(true)
    localStorage.setItem('notifications-enabled', enabled.toString())
    localStorage.setItem('notifications-minutes-before', minutesBefore.toString())
    
    setTimeout(() => {
      setSaving(false)
      toast({
        title: 'Settings Saved',
        description: 'Your notification preferences have been updated.',
      })
    }, 500)
  }

  if (!isSupported) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage your notification preferences.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Notifications are not supported in your browser.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage your notification preferences for task reminders.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {permission.granted ? (
              <Bell className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            Browser Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications for upcoming tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!permission.granted && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium mb-1">Notifications Not Enabled</div>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to enable browser notifications for task reminders.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleRequestPermission}
                className="mt-4"
              >
                <Bell className="mr-2 h-4 w-4" />
                Enable Notifications
              </Button>
            </div>
          )}

          {permission.granted && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders for upcoming tasks
                  </p>
                </div>
                <Switch
                  id="notifications-enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              {enabled && (
                <div className="space-y-2">
                  <Label htmlFor="minutes-before">
                    Remind me (minutes before task)
                  </Label>
                  <Input
                    id="minutes-before"
                    type="number"
                    min="1"
                    max="60"
                    value={minutesBefore}
                    onChange={(e) =>
                      setMinutesBefore(parseInt(e.target.value) || 15)
                    }
                    className="max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll receive a notification this many minutes before each task starts.
                  </p>
                </div>
              )}

              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Notifications are sent automatically for tasks with a start time</p>
          <p>• You&apos;ll receive a reminder based on your preference (default: 15 minutes before)</p>
          <p>• Notifications only appear for upcoming tasks (not past tasks)</p>
          <p>• Completed tasks won&apos;t trigger notifications</p>
          <p>• Notifications work even when the app is not open (if browser is running)</p>
        </CardContent>
      </Card>
    </div>
  )
}

