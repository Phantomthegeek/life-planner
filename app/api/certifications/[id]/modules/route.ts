import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const certId = params.id

    // Fetch modules for this certification
    const { data: modules, error } = await supabase
      .from('cert_modules')
      .select('*')
      .eq('cert_id', certId)
      .order('order_idx', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(modules || [])
  } catch (error) {
    console.error('Error fetching modules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const certId = params.id
    const body = await request.json()
    const { title, description, estimated_hours, order_idx } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Get current max order_idx
    const { data: existingModules } = await supabase
      .from('cert_modules')
      .select('order_idx')
      .eq('cert_id', certId)
      .order('order_idx', { ascending: false })
      .limit(1)

    const nextOrderIdx = order_idx !== undefined 
      ? order_idx 
      : (existingModules?.[0]?.order_idx ?? -1) + 1

    // Insert new module
    const { data: module, error } = await supabase
      .from('cert_modules')
      .insert({
        cert_id: certId,
        title,
        description: description || null,
        estimated_hours: estimated_hours || 1,
        order_idx: nextOrderIdx,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(module, { status: 201 })
  } catch (error) {
    console.error('Error creating module:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

