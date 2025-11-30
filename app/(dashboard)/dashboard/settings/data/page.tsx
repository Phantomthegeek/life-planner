'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Upload, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { exportData, importData, downloadFile, readFile } from '@/lib/export-import'

export default function DataManagementPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setLoading(true)
    try {
      // Fetch all user data
      const [tasksRes, habitsRes, notesRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/habits'),
        fetch('/api/notes'),
      ])

      const tasks = await tasksRes.json()
      const habits = await habitsRes.json()
      const notes = await notesRes.json()

      // Export data
      const jsonData = exportData({ tasks, habits, notes })
      const filename = `little-einstein-export-${new Date().toISOString().split('T')[0]}.json`
      
      downloadFile(jsonData, filename)

      toast({
        title: 'Export Successful',
        description: 'Your data has been exported successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      // Read file
      const jsonString = await readFile(file)
      
      // Parse and validate
      const data = importData(jsonString)

      // Import data (with confirmation)
      if (
        !confirm(
          `This will import ${data.tasks.length} tasks, ${data.habits.length} habits, and ${data.notes.length} notes. Continue?`
        )
      ) {
        return
      }

      // Create tasks
      for (const task of data.tasks) {
        const { id, user_id, created_at, ...taskData } = task
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        })
      }

      // Create habits
      for (const habit of data.habits) {
        const { id, user_id, ...habitData } = habit
        await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(habitData),
        })
      }

      // Create notes
      for (const note of data.notes) {
        const { id, user_id, created_at, ...noteData } = note
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData),
        })
      }

      toast({
        title: 'Import Successful',
        description: 'Your data has been imported successfully.',
      })

      // Refresh page to show new data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
        <p className="text-muted-foreground">
          Export or import your data as JSON.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download all your tasks, habits, and notes as a JSON file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your data to backup your information or transfer it to another account.
            </p>
            <Button
              onClick={handleExport}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Import tasks, habits, and notes from a JSON file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed p-4 bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Important</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Importing will add new items to your existing data. Duplicates may be created.
              </p>
            </div>
            <label>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={loading}
                className="hidden"
              />
              <Button
                asChild
                variant="outline"
                disabled={loading}
                className="w-full"
              >
                <span>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File to Import
                    </>
                  )}
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

