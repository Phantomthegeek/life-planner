import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, tasks, workHoursStart = '09:00', workHoursEnd = '17:00' } = body

    if (!date || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'Date and tasks array are required' },
        { status: 400 }
      )
    }

    // Get existing tasks for the day
    const { data: existingTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .not('start_ts', 'is', null)
      .order('start_ts', { ascending: true })

    // Get user preferences
    const { data: preferences } = await supabase
      .from('users')
      .select('wake_time, sleep_time, work_hours_start, work_hours_end')
      .eq('id', user.id)
      .single()

    const startHour = parseInt(workHoursStart.split(':')[0])
    const endHour = parseInt(workHoursEnd.split(':')[0])

    // Sort tasks by priority (urgency + importance)
    const sortedTasks = [...tasks].sort((a, b) => {
      // You can add priority logic here
      return 0
    })

    // Create time blocks
    const timeBlocks: Array<{
      task_id: string
      start: string
      end: string
      duration_minutes: number
    }> = []

    let currentTime = new Date(`${date}T${startHour.toString().padStart(2, '0')}:00:00`)
    const endTime = new Date(`${date}T${endHour.toString().padStart(2, '0')}:00:00`)
    const bufferMinutes = 15 // Buffer between tasks

    for (const task of sortedTasks) {
      const duration = task.duration_minutes || 60
      const taskEnd = new Date(currentTime.getTime() + duration * 60000)

      // Check if task fits in work hours
      if (taskEnd > endTime) {
        // Move to next day or flag as overflow
        break
      }

      // Check for conflicts with existing tasks
      const conflicts = existingTasks?.filter((et) => {
        const etStart = new Date(et.start_ts!)
        const etEnd = new Date(et.end_ts!)
        return (
          (currentTime >= etStart && currentTime < etEnd) ||
          (taskEnd > etStart && taskEnd <= etEnd) ||
          (currentTime <= etStart && taskEnd >= etEnd)
        )
      })

      if (conflicts && conflicts.length > 0) {
        // Skip conflicting time slot, move after the last conflict
        const lastConflict = conflicts.reduce((latest, conflict) => {
          const end = new Date(conflict.end_ts!)
          return end > latest ? end : latest
        }, new Date(0))
        currentTime = new Date(lastConflict.getTime() + bufferMinutes * 60000)
        continue
      }

      timeBlocks.push({
        task_id: task.id,
        start: currentTime.toISOString(),
        end: taskEnd.toISOString(),
        duration_minutes: duration,
      })

      currentTime = new Date(taskEnd.getTime() + bufferMinutes * 60000)
    }

    return NextResponse.json({
      time_blocks: timeBlocks,
      total_tasks_scheduled: timeBlocks.length,
      overflow_tasks: sortedTasks.length - timeBlocks.length,
    })
  } catch (error: any) {
    console.error('Error creating time blocks:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

