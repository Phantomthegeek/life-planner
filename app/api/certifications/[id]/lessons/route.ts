import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateLessonStructure, generateLessonContent } from '@/lib/ai/lesson-generator'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// AI content generation per lesson is slow — Vercel's default 10s function
// limit isn't enough when we're calling OpenAI 6+ times. Bump to 5 min.
export const maxDuration = 300

/**
 * GET: fetch lessons (with their content rows) for a certification, optionally
 * scoped to one module.
 */
export async function GET(
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
    const moduleId = searchParams.get('module_id')

    let query = supabase
      .from('cert_lessons')
      .select(
        `
        *,
        cert_modules!inner(cert_id),
        cert_lesson_content(*)
      `
      )
      .eq('cert_modules.cert_id', params.id)

    if (moduleId) {
      query = query.eq('module_id', moduleId)
    }

    const { data: lessons, error } = await query.order('order_idx', { ascending: true })
    if (error) throw error

    return NextResponse.json(lessons || [])
  } catch (error: any) {
    console.error('GET /lessons error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}

/**
 * POST: generate lessons for a module.
 *
 * Body: { module_id: string, regenerate?: boolean }
 *
 * Behaviour:
 * - Requires an authenticated user.
 * - If lessons already exist for the module and `regenerate` is false,
 *   returns 409. With `regenerate: true`, wipes existing lessons first.
 * - Uses the service-role admin client for writes into the shared catalog
 *   tables (cert_lessons / cert_lesson_content). They're public-read by
 *   design; only the server should write to them on the user's behalf.
 * - AI calls for lesson content run in parallel — much faster than the
 *   previous serial loop.
 * - Returns the freshly inserted lesson rows. The endpoint either fully
 *   succeeds or returns a clear error — no more silent "Generated 0
 *   lessons" responses.
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured on the server.' },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { module_id, regenerate } = body as {
      module_id?: string
      regenerate?: boolean
    }

    if (!module_id) {
      return NextResponse.json(
        { error: 'module_id is required' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Fetch module + its certification (admin client: we don't need RLS here
    // and avoiding RLS skips the cert_modules inner-join silliness).
    const { data: module, error: moduleError } = await admin
      .from('cert_modules')
      .select('id, cert_id, title, description, estimated_hours, certifications(name)')
      .eq('id', module_id)
      .eq('cert_id', params.id)
      .single()

    if (moduleError || !module) {
      return NextResponse.json(
        { error: 'Module not found for this certification.' },
        { status: 404 }
      )
    }

    // Check for existing lessons — refuse to silently duplicate.
    const { data: existingLessons, error: existingErr } = await admin
      .from('cert_lessons')
      .select('id')
      .eq('module_id', module_id)

    if (existingErr) {
      return NextResponse.json(
        { error: `Could not check existing lessons: ${existingErr.message}` },
        { status: 500 }
      )
    }

    if (existingLessons && existingLessons.length > 0) {
      if (!regenerate) {
        return NextResponse.json(
          {
            error: 'Lessons already exist for this module.',
            existing_count: existingLessons.length,
            hint: 'Pass { regenerate: true } to wipe and rebuild.',
          },
          { status: 409 }
        )
      }

      // Cascade should clean cert_lesson_content via FK on delete cascade.
      const { error: deleteErr } = await admin
        .from('cert_lessons')
        .delete()
        .eq('module_id', module_id)
      if (deleteErr) {
        return NextResponse.json(
          { error: `Failed to wipe old lessons: ${deleteErr.message}` },
          { status: 500 }
        )
      }
    }

    // Step 1: ask the AI to plan out the lesson breakdown.
    let structure
    try {
      structure = await generateLessonStructure(
        module.title,
        module.description,
        module.estimated_hours
      )
    } catch (e: any) {
      return NextResponse.json(
        { error: `AI failed to plan lessons: ${e.message || 'unknown'}` },
        { status: 502 }
      )
    }

    if (!structure?.lessons?.length) {
      return NextResponse.json(
        { error: 'AI returned an empty lesson plan. Try again.' },
        { status: 502 }
      )
    }

    // Step 2: insert lesson rows in a single batch.
    const lessonRows = structure.lessons.map((l, idx) => ({
      module_id,
      title: l.title?.slice(0, 200) || `Lesson ${idx + 1}`,
      description: l.description || null,
      order_idx: typeof l.order === 'number' ? l.order : idx + 1,
      estimated_minutes: Math.max(5, Math.min(120, Number(l.estimated_minutes) || 15)),
      difficulty_level: Math.max(1, Math.min(5, Number(l.difficulty) || 2)),
      ai_generated: true,
    }))

    const { data: insertedLessons, error: insertLessonsErr } = await admin
      .from('cert_lessons')
      .insert(lessonRows)
      .select()

    if (insertLessonsErr || !insertedLessons) {
      return NextResponse.json(
        { error: `Failed to save lessons: ${insertLessonsErr?.message || 'unknown'}` },
        { status: 500 }
      )
    }

    // Step 3: generate detailed content for every lesson in parallel.
    // Each call is its own try/catch so one bad lesson doesn't kill the rest.
    const certName =
      (Array.isArray(module.certifications)
        ? module.certifications[0]?.name
        : (module.certifications as any)?.name) || 'Unknown'

    const contentResults = await Promise.allSettled(
      insertedLessons.map((lesson, idx) => {
        const plan = structure.lessons[idx]
        return generateLessonContent({
          moduleTitle: module.title,
          moduleDescription: module.description ?? undefined,
          certificationName: certName,
          difficulty: lesson.difficulty_level,
          estimatedMinutes: lesson.estimated_minutes,
        }).then((content) => ({
          lessonId: lesson.id,
          plan,
          content,
        }))
      })
    )

    // Step 4: flatten the content into rows and insert in one batch.
    const contentRows: any[] = []
    const failedLessonIds: string[] = []

    contentResults.forEach((result, idx) => {
      const lessonId = insertedLessons[idx].id
      if (result.status !== 'fulfilled') {
        failedLessonIds.push(lessonId)
        console.error(
          `Content gen failed for lesson ${lessonId}:`,
          result.reason?.message || result.reason
        )
        return
      }
      const { content } = result.value
      const generated_at = new Date().toISOString()
      contentRows.push(
        {
          lesson_id: lessonId,
          content_type: 'intro',
          content_data: { intro: content.intro },
          ai_generated: true,
          generated_at,
        },
        {
          lesson_id: lessonId,
          content_type: 'concepts',
          content_data: { concepts: content.concepts },
          ai_generated: true,
          generated_at,
        },
        {
          lesson_id: lessonId,
          content_type: 'practical',
          content_data: { practical: content.practical },
          ai_generated: true,
          generated_at,
        },
        {
          lesson_id: lessonId,
          content_type: 'summary',
          content_data: { summary: content.summary },
          ai_generated: true,
          generated_at,
        }
      )
    })

    if (contentRows.length > 0) {
      const { error: contentErr } = await admin
        .from('cert_lesson_content')
        .insert(contentRows)
      if (contentErr) {
        // We still keep the lesson rows; the user can regenerate. But report.
        console.error('Bulk content insert failed:', contentErr)
        return NextResponse.json(
          {
            lessons: insertedLessons,
            warning: `Lessons created but content insert failed: ${contentErr.message}. You can try "Regenerate" to retry.`,
          },
          { status: 207 }
        )
      }
    }

    return NextResponse.json({
      lessons: insertedLessons,
      message: `Generated ${insertedLessons.length} lesson${insertedLessons.length === 1 ? '' : 's'}.`,
      ...(failedLessonIds.length > 0 && {
        warning: `Content generation failed for ${failedLessonIds.length} lesson(s). Try regenerating.`,
      }),
    })
  } catch (error: any) {
    console.error('POST /lessons error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate lessons' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: remove a single lesson. Body: { lesson_id: string }.
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
    if (!lessonId) {
      return NextResponse.json(
        { error: 'lesson_id query param is required' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Sanity check: this lesson actually belongs to a module under this cert.
    const { data: lesson, error: fetchErr } = await admin
      .from('cert_lessons')
      .select('id, cert_modules!inner(cert_id)')
      .eq('id', lessonId)
      .single()

    if (fetchErr || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const lessonCertId = Array.isArray(lesson.cert_modules)
      ? lesson.cert_modules[0]?.cert_id
      : (lesson.cert_modules as any)?.cert_id

    if (lessonCertId !== params.id) {
      return NextResponse.json(
        { error: 'Lesson does not belong to this certification' },
        { status: 403 }
      )
    }

    const { error: deleteErr } = await admin
      .from('cert_lessons')
      .delete()
      .eq('id', lessonId)

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /lessons error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete lesson' },
      { status: 500 }
    )
  }
}
