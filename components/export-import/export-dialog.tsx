'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Download, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ExportDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const { toast } = useToast()

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, types: ['all'] }),
      })

      if (!response.ok) throw new Error('Export failed')

      const data = await response.json()
      
      // Download file
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(data, null, 2) : JSON.stringify(data)],
        { type: format === 'json' ? 'application/json' : 'text/csv' }
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `little-einstein-export-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Export Successful',
        description: `Your data has been exported as ${format.toUpperCase()}`,
      })

      setOpen(false)
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Your Data</DialogTitle>
          <DialogDescription>
            Export all your tasks, habits, notes, and certifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'json' | 'csv')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="font-normal cursor-pointer">
                  JSON (Recommended - Full data with structure)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="font-normal cursor-pointer">
                  CSV (Spreadsheet compatible)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>This will export:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>All tasks</li>
              <li>All habits</li>
              <li>All notes</li>
              <li>All certifications and progress</li>
            </ul>
          </div>

          <Button onClick={handleExport} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Now
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

