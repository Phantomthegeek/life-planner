import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all unique tags from user's tasks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('tags')
      .eq('user_id', user.id)
      .not('tags', 'is', null)

    if (error) throw error

    // Extract unique tags
    const tagSet = new Set<string>()
    tasks?.forEach((task) => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach((tag: string) => tagSet.add(tag))
      }
    })

    // Also get tags from tags table
    const { data: definedTags } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)

    return NextResponse.json({
      tags: Array.from(tagSet),
      definedTags: definedTags || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tags' },
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
    const { name, color = '#6366f1' } = body

    if (!name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tags')
      .insert({ user_id: user.id, name, color })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create tag' },
      { status: 500 }
    )
  }
}

