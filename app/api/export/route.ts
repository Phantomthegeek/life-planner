import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportData } from '@/lib/export-import/export'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { format = 'json', types = ['all'] } = body

    // Fetch all user data
    const [tasksRes, habitsRes, notesRes, certsRes, certProgressRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('notes').select('*').eq('user_id', user.id),
      supabase.from('certifications').select('*'),
      supabase.from('user_cert_progress').select('*').eq('user_id', user.id),
    ])

    const exportDataContent = {
      tasks: tasksRes.data || [],
      habits: habitsRes.data || [],
      notes: notesRes.data || [],
      certifications: certsRes.data || [],
      certProgress: certProgressRes.data || [],
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }

    // Log export
    await supabase.from('export_logs').insert({
      user_id: user.id,
      export_type: format,
      data_type: types.join(','),
    })

    if (format === 'json') {
      return NextResponse.json(exportDataContent, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="little-einstein-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }

    // For CSV, we'd need to convert, but for now return JSON
    return NextResponse.json(exportDataContent)
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

