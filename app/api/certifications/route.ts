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
    const includeProgress = searchParams.get('includeProgress') === 'true'

    // Fetch all certifications
    const { data: certifications, error: certError } = await supabase
      .from('certifications')
      .select('*')
      .order('name', { ascending: true })

    if (certError) {
      return NextResponse.json({ error: certError.message }, { status: 400 })
    }

    if (!includeProgress) {
      return NextResponse.json(certifications)
    }

    // Fetch user's progress for each certification
    const { data: progress, error: progressError } = await supabase
      .from('user_cert_progress')
      .select('*')
      .eq('user_id', user.id)

    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 400 })
    }

    const certsWithProgress = (certifications || []).map((cert) => {
      const userProgress = (progress || []).find((p) => p.cert_id === cert.id)
      return {
        ...cert,
        progress: userProgress || null,
      }
    })

    return NextResponse.json(certsWithProgress)
  } catch (error) {
    console.error('Error fetching certifications:', error)
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
    const { slug, name, description, difficulty } = body

    if (!slug || !name) {
      return NextResponse.json(
        { error: 'Slug and name are required' },
        { status: 400 }
      )
    }

    // Check if certification already exists
    const { data: existing } = await supabase
      .from('certifications')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Certification with this slug already exists' },
        { status: 409 }
      )
    }

    // Insert new certification
    const { data: certification, error: insertError } = await supabase
      .from('certifications')
      .insert({
        slug,
        name,
        description: description || null,
        difficulty: difficulty || 3,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(certification, { status: 201 })
  } catch (error) {
    console.error('Error creating certification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const certId = searchParams.get('id')

    if (!certId) {
      return NextResponse.json(
        { error: 'Certification ID is required' },
        { status: 400 }
      )
    }

    // First, delete all related progress records
    const { error: progressError } = await supabase
      .from('user_cert_progress')
      .delete()
      .eq('cert_id', certId)

    if (progressError) {
      console.error('Error deleting progress:', progressError)
      // Continue even if progress deletion fails
    }

    // Delete all related modules and lessons
    const { data: modules } = await supabase
      .from('cert_modules')
      .select('id')
      .eq('cert_id', certId)

    if (modules && modules.length > 0) {
      const moduleIds = modules.map((m) => m.id)
      
      // Delete lessons
      await supabase
        .from('cert_lessons')
        .delete()
        .in('module_id', moduleIds)

      // Delete modules
      await supabase
        .from('cert_modules')
        .delete()
        .eq('cert_id', certId)
    }

    // Finally, delete the certification itself
    const { error: deleteError } = await supabase
      .from('certifications')
      .delete()
      .eq('id', certId)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting certification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

