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
    const memory_type = searchParams.get('memory_type')

    let query = supabase
      .from('chat_memory')
      .select('*')
      .eq('user_id', user.id)

    if (memory_type) {
      query = query.eq('memory_type', memory_type)
    }

    const { data: memories, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ memories: memories || [] })
  } catch (error: any) {
    console.error('Error fetching chat memory:', error)
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
    const { memory_type, memory_key, memory_value, confidence } = body

    if (!memory_type || !memory_key || !memory_value) {
      return NextResponse.json(
        { error: 'memory_type, memory_key, and memory_value are required' },
        { status: 400 }
      )
    }

    const { data: memory, error } = await supabase
      .from('chat_memory')
      .upsert({
        user_id: user.id,
        memory_type,
        memory_key,
        memory_value,
        confidence: confidence || 0.5,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'user_id,memory_type,memory_key',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ memory })
  } catch (error: any) {
    console.error('Error saving chat memory:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

