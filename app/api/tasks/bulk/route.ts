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
    const { taskIds, action, updates } = body

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'Task IDs are required' }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    let result

    switch (action) {
      case 'delete':
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('user_id', user.id)
          .in('id', taskIds)

        if (deleteError) throw deleteError
        result = { deleted: taskIds.length }
        break

      case 'update':
        if (!updates) {
          return NextResponse.json({ error: 'Updates are required' }, { status: 400 })
        }

        const { error: updateError } = await supabase
          .from('tasks')
          .update(updates)
          .eq('user_id', user.id)
          .in('id', taskIds)

        if (updateError) throw updateError
        result = { updated: taskIds.length }
        break

      case 'complete':
        const { error: completeError } = await supabase
          .from('tasks')
          .update({ done: true })
          .eq('user_id', user.id)
          .in('id', taskIds)

        if (completeError) throw completeError
        result = { completed: taskIds.length }
        break

      case 'uncomplete':
        const { error: uncompleteError } = await supabase
          .from('tasks')
          .update({ done: false })
          .eq('user_id', user.id)
          .in('id', taskIds)

        if (uncompleteError) throw uncompleteError
        result = { uncompleted: taskIds.length }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}

