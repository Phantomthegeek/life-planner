import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const project_id = searchParams.get('project_id')
    const goal_id = searchParams.get('goal_id')

    let query = supabase
      .from('milestones')
      .select(`
        *,
        projects!milestones_project_id_fkey(user_id),
        goals!milestones_goal_id_fkey(user_id)
      `)
      .order('order_idx', { ascending: true })

    if (project_id) {
      query = query.eq('project_id', project_id)
    }
    if (goal_id) {
      query = query.eq('goal_id', goal_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Filter by user_id (since we can't do it directly with the join)
    const filtered = data?.filter((m: any) => {
      if (m.projects) return m.projects.user_id === user.id
      if (m.goals) return m.goals.user_id === user.id
      return false
    })

    return NextResponse.json(filtered || [])
  } catch (error: any) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { project_id, goal_id, name, description, target_date, order_idx } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!project_id && !goal_id) {
      return NextResponse.json(
        { error: 'Either project_id or goal_id is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    if (project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', project_id)
        .single()

      if (!project || project.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    if (goal_id) {
      const { data: goal } = await supabase
        .from('goals')
        .select('user_id')
        .eq('id', goal_id)
        .single()

      if (!goal || goal.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const { data: milestone, error: insertError } = await supabase
      .from('milestones')
      .insert({
        project_id: project_id || null,
        goal_id: goal_id || null,
        name,
        description: description || null,
        target_date: target_date || null,
        order_idx: order_idx || 0,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json(milestone, { status: 201 })
  } catch (error: any) {
    console.error('Error creating milestone:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

