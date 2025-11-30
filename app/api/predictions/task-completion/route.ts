import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { predictTaskCompletion, identifyRiskTasks } from '@/lib/predictions/task-completion'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('task_id')
    const date = searchParams.get('date')

    if (taskId) {
      // Predict single task
      const prediction = await predictTaskCompletion(user.id, taskId)
      return NextResponse.json(prediction)
    } else if (date) {
      // Identify risk tasks for a date
      const result = await identifyRiskTasks(user.id, date)
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: 'task_id or date parameter required' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error predicting task completion:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

