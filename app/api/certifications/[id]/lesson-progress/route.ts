import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Cross-device lesson completion tracking. The actual store is
// `cert_progress_detailed`, keyed by (user_id, lesson_id) with a uniqueness
// constraint so upserts behave idempotently.
//
// All routes scope by certification: we resolve the cert's modules first, then
// look at completions whose `module_id` is in that set. This means a single
// cert page only ever sees its own lessons, even if the user is enrolled in
// many courses.

/**
 * GET: return the list of lesson IDs the current user has completed for this
 * certification, plus a small bit of metadata. Response shape:
 *   {
 *     completed_lesson_ids: string[],
 *     last_accessed: Record<string, string>   // lesson_id -> ISO timestamp
 *   }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Restrict to modules belonging to this cert. Without this scope a user's
    // completion rows from other courses would leak into the response.
    const { data: moduleRows, error: modulesErr } = await supabase
      .from('cert_modules')
      .select('id')
      .eq('cert_id', params.id)

    if (modulesErr) throw modulesErr

    const moduleIds = (moduleRows || []).map((m) => m.id)
    if (moduleIds.length === 0) {
      return NextResponse.json({ completed_lesson_ids: [], last_accessed: {} })
    }

    const { data, error } = await supabase
      .from('cert_progress_detailed')
      .select('lesson_id, completion_status, completed_at, last_accessed_at')
      .eq('user_id', user.id)
      .in('module_id', moduleIds)
      .not('lesson_id', 'is', null)

    if (error) throw error

    const completed_lesson_ids: string[] = []
    const last_accessed: Record<string, string> = {}
    for (const row of data || []) {
      if (!row.lesson_id) continue
      if (row.completion_status === 'completed' || row.completion_status === 'mastered') {
        completed_lesson_ids.push(row.lesson_id)
      }
      if (row.last_accessed_at) {
        last_accessed[row.lesson_id] = row.last_accessed_at
      }
    }

    return NextResponse.json({ completed_lesson_ids, last_accessed })
  } catch (error: any) {
    console.error('GET /lesson-progress error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch lesson progress' },
      { status: 500 }
    )
  }
}

/**
 * POST: mark one or more lessons complete (or in-progress) for this user.
 * Accepts:
 *   { lesson_id: string, status?: 'completed' | 'in_progress' }
 * or, for migrating localStorage in bulk:
 *   { lesson_ids: string[], status?: 'completed' | 'in_progress' }
 *
 * We resolve each lesson's module_id from the DB so the caller doesn't have to
 * trust the client. This also enforces that the lesson belongs to a module of
 * this certification.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const status = body.status === 'in_progress' ? 'in_progress' : 'completed'
    const rawIds: unknown =
      Array.isArray(body.lesson_ids) && body.lesson_ids.length
        ? body.lesson_ids
        : body.lesson_id
        ? [body.lesson_id]
        : []
    const lessonIds = (rawIds as unknown[]).filter(
      (v): v is string => typeof v === 'string' && v.length > 0
    )

    if (lessonIds.length === 0) {
      return NextResponse.json(
        { error: 'lesson_id or lesson_ids is required' },
        { status: 400 }
      )
    }

    // Get this cert's module IDs first. We then filter lessons to ones that
    // belong to those modules — this rejects any IDs from other certs that
    // the client might have included, accidentally or otherwise.
    const { data: moduleRows, error: modulesErr } = await supabase
      .from('cert_modules')
      .select('id')
      .eq('cert_id', params.id)

    if (modulesErr) throw modulesErr

    const moduleIds = (moduleRows || []).map((m) => m.id)
    if (moduleIds.length === 0) {
      return NextResponse.json(
        { error: 'No matching lessons for this certification' },
        { status: 404 }
      )
    }

    const { data: lessonRows, error: lessonsErr } = await supabase
      .from('cert_lessons')
      .select('id, module_id')
      .in('id', lessonIds)
      .in('module_id', moduleIds)

    if (lessonsErr) throw lessonsErr

    const validLessons = (lessonRows || []).filter(
      (l): l is { id: string; module_id: string } =>
        typeof l.id === 'string' && typeof l.module_id === 'string'
    )

    if (validLessons.length === 0) {
      return NextResponse.json(
        { error: 'No matching lessons for this certification' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    const rows = validLessons.map((l) => ({
      user_id: user.id,
      module_id: l.module_id,
      lesson_id: l.id,
      completion_status: status,
      progress_percentage: status === 'completed' ? 100 : 0,
      completed_at: status === 'completed' ? now : null,
      last_accessed_at: now,
    }))

    const { error: upsertErr } = await supabase
      .from('cert_progress_detailed')
      .upsert(rows, { onConflict: 'user_id,lesson_id' })

    if (upsertErr) throw upsertErr

    return NextResponse.json({
      ok: true,
      updated: rows.length,
      status,
    })
  } catch (error: any) {
    console.error('POST /lesson-progress error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to record lesson progress' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: unmark a lesson. Two modes:
 *   ?lesson_id=<uuid>  -> unmark a single lesson
 *   ?all=1             -> clear all progress for this cert (used when wiping
 *                        a course)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lesson_id')
    const all = searchParams.get('all') === '1'

    if (!lessonId && !all) {
      return NextResponse.json(
        { error: 'lesson_id or all=1 is required' },
        { status: 400 }
      )
    }

    // Scope deletes to this cert's modules so a malformed request can't wipe
    // unrelated progress.
    const { data: moduleRows, error: modulesErr } = await supabase
      .from('cert_modules')
      .select('id')
      .eq('cert_id', params.id)

    if (modulesErr) throw modulesErr

    const moduleIds = (moduleRows || []).map((m) => m.id)
    if (moduleIds.length === 0) {
      return NextResponse.json({ ok: true, deleted: 0 })
    }

    let deleteQuery = supabase
      .from('cert_progress_detailed')
      .delete()
      .eq('user_id', user.id)
      .in('module_id', moduleIds)

    if (lessonId) {
      deleteQuery = deleteQuery.eq('lesson_id', lessonId)
    }

    const { error: deleteErr, count } = await deleteQuery
    if (deleteErr) throw deleteErr

    return NextResponse.json({ ok: true, deleted: count ?? 0 })
  } catch (error: any) {
    console.error('DELETE /lesson-progress error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete lesson progress' },
      { status: 500 }
    )
  }
}
