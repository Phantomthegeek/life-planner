import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_cert_progress')
      .select(`
        *,
        certifications (*)
      `)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching cert progress:', error)
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
    const { cert_id, progress, target_date, exam_scheduled, exam_date } = body

    if (!cert_id) {
      return NextResponse.json(
        { error: 'Certification ID is required' },
        { status: 400 }
      )
    }

    // Check if progress already exists
    const { data: existing } = await supabase
      .from('user_cert_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('cert_id', cert_id)
      .single()

    let data, error

    if (existing) {
      // Update existing progress
      const updateData: any = {}
      if (progress !== undefined) updateData.progress = progress
      if (target_date !== undefined) updateData.target_date = target_date
      if (exam_scheduled !== undefined) updateData.exam_scheduled = exam_scheduled
      if (exam_date !== undefined) updateData.exam_date = exam_date

      const result = await supabase
        .from('user_cert_progress')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()
      
      data = result.data
      error = result.error
    } else {
      // Create new progress
      const result = await supabase
        .from('user_cert_progress')
        .insert({
          user_id: user.id,
          cert_id,
          progress: progress || 0,
          target_date,
          exam_scheduled: exam_scheduled || false,
          exam_date,
        })
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating cert progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

