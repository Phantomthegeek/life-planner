import { Task, Habit, Note } from '@/lib/types'

export interface ExportData {
  tasks: Task[]
  habits: Habit[]
  notes: Note[]
  exportedAt: string
  version: string
}

export function exportData(data: {
  tasks: Task[]
  habits: Habit[]
  notes: Note[]
}): string {
  const exportData: ExportData = {
    ...data,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  }

  return JSON.stringify(exportData, null, 2)
}

export function importData(jsonString: string): ExportData {
  try {
    const data = JSON.parse(jsonString) as ExportData

    // Validate structure
    if (!data.tasks || !data.habits || !data.notes) {
      throw new Error('Invalid export format')
    }

    return data
  } catch (error) {
    throw new Error('Failed to parse import data: ' + (error as Error).message)
  }
}

export function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsText(file)
  })
}

