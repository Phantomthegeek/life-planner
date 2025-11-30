import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(rules || [])
  } catch (error: any) {
    console.error('Error fetching automation rules:', error)
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
    const { name, trigger_type, trigger_config, action_type, action_config, enabled } = body

    if (!name || !trigger_type || !action_type) {
      return NextResponse.json(
        { error: 'Name, trigger_type, and action_type are required' },
        { status: 400 }
      )
    }

    const { data: rule, error: insertError } = await supabase
      .from('automation_rules')
      .insert({
        user_id: user.id,
        name,
        trigger_type,
        trigger_config: trigger_config || {},
        action_type,
        action_config: action_config || {},
        enabled: enabled !== undefined ? enabled : true,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json(rule, { status: 201 })
  } catch (error: any) {
    console.error('Error creating automation rule:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

