import { ExportData } from './export'

export interface ImportResult {
  success: boolean
  imported: {
    tasks: number
    habits: number
    notes: number
    certifications: number
  }
  errors: string[]
}

export async function importFromJSON(jsonString: string): Promise<ExportData | null> {
  try {
    const data = JSON.parse(jsonString) as ExportData
    // Validate structure
    if (!data.tasks || !data.habits || !data.notes) {
      throw new Error('Invalid export format: missing required fields')
    }
    return data
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function importFromCSV(csvString: string): Promise<Partial<ExportData>> {
  // Basic CSV parsing - can be enhanced
  const lines = csvString.split('\n')
  const tasks: any[] = []
  const habits: any[] = []
  const notes: any[] = []

  let currentSection: 'tasks' | 'habits' | 'notes' | null = null
  let headers: string[] = []

  for (const line of lines) {
    if (!line.trim()) continue

    if (line === 'Tasks') {
      currentSection = 'tasks'
      continue
    } else if (line === 'Habits') {
      currentSection = 'habits'
      continue
    } else if (line === 'Notes') {
      currentSection = 'notes'
      continue
    }

    if (line.includes('ID,')) {
      headers = line.split(',').map((h) => h.trim())
      continue
    }

    if (currentSection && headers.length > 0) {
      const values = parseCSVLine(line)
      if (values.length === headers.length) {
        const item: any = {}
        headers.forEach((header, idx) => {
          const value = values[idx]
          // Remove quotes and clean up
          const cleanValue = value.replace(/^"|"$/g, '').replace(/""/g, '"')
          
          if (header === 'Done') {
            item.done = cleanValue === 'Yes'
          } else if (header.includes('At')) {
            item[header.toLowerCase().replace(' ', '_')] = cleanValue
          } else {
            item[header.toLowerCase().replace(' ', '_')] = cleanValue
          }
        })
        
        if (currentSection === 'tasks') {
          tasks.push(item)
        } else if (currentSection === 'habits') {
          habits.push(item)
        } else if (currentSection === 'notes') {
          notes.push(item)
        }
      }
    }
  }

  return {
    tasks,
    habits,
    notes,
    certifications: [],
    certProgress: [],
    exportedAt: new Date().toISOString(),
    version: '1.0',
  }
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  values.push(current)

  return values
}

