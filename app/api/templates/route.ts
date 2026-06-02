import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Task templates are server-stored so the user's library of reusable task
// shapes (e.g. "Morning Routine", "Deep Work Block") syncs across every
// device. The store keeps a localStorage cache for instant paint, but the
// server is authoritative.

interface IncomingTemplate {
  name?: unknown
  title?: unknown
  detail?: unknown
  duration_minutes?: unknown
  category?: unknown
}

function sanitize(body: IncomingTemplate) {
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : ''
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
  const detail =
    typeof body.detail === 'string'
      ? body.detail.trim().slice(0, 2000) || null
      : null
  const durationNum = Number(body.duration_minutes)
  const duration_minutes =
    Number.isFinite(durationNum) && durationNum > 0
      ? Math.min(Math.floor(durationNum), 24 * 60)
      : 60
  const category =
    typeof body.category === 'string' && body.category.trim().length > 0
      ? body.category.trim().slice(0, 50)
      : 'work'
  return { name, title, detail, duration_minutes, category }
}

/**
 * GET: list all templates for the current user.
 */
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_task_templates')
      .select('id, name, title, detail, duration_minutes, category, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (error: any) {
    console.error('GET /templates error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

/**
 * POST: create a new template. Accepts a single template or `{ templates: [...] }`
 * for bulk import (used by the localStorage migration on first server-sync).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const incoming: IncomingTemplate[] = Array.isArray(body?.templates)
      ? body.templates
      : [body]

    const rows = incoming
      .map(sanitize)
      .filter((row) => row.name.length > 0 && row.title.length > 0)
      .map((row) => ({ ...row, user_id: user.id }))

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'name and title are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('user_task_templates')
      .insert(rows)
      .select('id, name, title, detail, duration_minutes, category, created_at, updated_at')

    if (error) throw error

    return NextResponse.json({ templates: data ?? [] })
  } catch (error: any) {
    console.error('POST /templates error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create template' },
      { status: 500 }
    )
  }
}

/**
 * PATCH: update one template by id (must belong to the current user; RLS
 * enforces this in addition to the explicit filter).
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const id = typeof body.id === 'string' ? body.id : ''
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const sanitized = sanitize(body)
    const updates: Record<string, unknown> = {}
    if (sanitized.name.length > 0) updates.name = sanitized.name
    if (sanitized.title.length > 0) updates.title = sanitized.title
    if (body.detail !== undefined) updates.detail = sanitized.detail
    if (body.duration_minutes !== undefined)
      updates.duration_minutes = sanitized.duration_minutes
    if (body.category !== undefined) updates.category = sanitized.category

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_task_templates')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('PATCH /templates error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: remove a template by id.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_task_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DELETE /templates error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete template' },
      { status: 500 }
    )
  }
}
