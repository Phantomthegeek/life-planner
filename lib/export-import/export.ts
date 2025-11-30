import { Task, Habit, Note, Certification, UserCertProgress } from '@/lib/types'

export interface ExportData {
  tasks: Task[]
  habits: Habit[]
  notes: Note[]
  certifications: Certification[]
  certProgress: UserCertProgress[]
  exportedAt: string
  version: string
}

export async function exportToJSON(data: ExportData): Promise<string> {
  return JSON.stringify(data, null, 2)
}

export function exportToCSV(
  data: ExportData,
  type: 'tasks' | 'habits' | 'notes' | 'all' = 'all'
): string {
  const csvRows: string[] = []

  if (type === 'tasks' || type === 'all') {
    csvRows.push('Tasks')
    csvRows.push('ID,Title,Detail,Date,Category,Done,Created At')
    data.tasks.forEach((task) => {
      csvRows.push(
        [
          task.id,
          `"${(task.title || '').replace(/"/g, '""')}"`,
          `"${(task.detail || '').replace(/"/g, '""')}"`,
          task.date,
          task.category || '',
          task.done ? 'Yes' : 'No',
          task.created_at,
        ].join(',')
      )
    })
    csvRows.push('')
  }

  if (type === 'habits' || type === 'all') {
    csvRows.push('Habits')
    csvRows.push('ID,Name,Streak,Best Streak,Last Done')
    data.habits.forEach((habit) => {
      csvRows.push(
        [
          habit.id,
          `"${(habit.name || '').replace(/"/g, '""')}"`,
          habit.streak || 0,
          habit.best_streak || 0,
          habit.last_done || '',
        ].join(',')
      )
    })
    csvRows.push('')
  }

  if (type === 'notes' || type === 'all') {
    csvRows.push('Notes')
    csvRows.push('ID,Date,Content,Created At')
    data.notes.forEach((note) => {
      csvRows.push(
        [
          note.id,
          note.date,
          `"${(note.content || '').replace(/"/g, '""')}"`,
          note.created_at,
        ].join(',')
      )
    })
    csvRows.push('')
  }

  return csvRows.join('\n')
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function exportData(
  data: ExportData,
  format: 'json' | 'csv' = 'json'
): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0]
  let content: string
  let filename: string
  let mimeType: string

  if (format === 'json') {
    content = await exportToJSON(data)
    filename = `little-einstein-export-${timestamp}.json`
    mimeType = 'application/json'
  } else {
    content = exportToCSV(data)
    filename = `little-einstein-export-${timestamp}.csv`
    mimeType = 'text/csv'
  }

  downloadFile(content, filename, mimeType)
}

