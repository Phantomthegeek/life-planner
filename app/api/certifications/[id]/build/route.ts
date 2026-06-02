import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  generateLessonStructure,
  generateLessonContent,
} from '@/lib/ai/lesson-generator'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// A full course build can fan out to 30–60+ OpenAI calls. They run in
// parallel so the wall-clock time is roughly two AI round-trips, but we still
// budget five minutes to give ourselves headroom on the slowest models.
export const maxDuration = 300

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
  return new OpenAI({ apiKey })
}

interface AIModule {
  title: string
  description?: string
  estimated_hours?: number
  order_idx?: number
}

/**
 * POST /api/certifications/[id]/build
 *
 * One-shot pipeline that turns a freshly-added certification into a fully
 * populated course: modules → lessons → lesson content, all in one call.
 *
 * Behaviour:
 *  - Requires an authenticated user (we don't want the public draining tokens).
 *  - Skips work that's already done. Re-running on a partially built course
 *    only generates what's missing. Pass { regenerate: true } to wipe.
 *  - Uses the admin client for writes into the shared course catalog
 *    (cert_modules / cert_lessons / cert_lesson_content) — same pattern as
 *    /api/certifications/[id]/lessons.
 *  - Fan-out is parallel via Promise.allSettled, so a single bad lesson
 *    doesn't fail the whole build.
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
    const regenerate = Boolean(body?.regenerate)

    const admin = createAdminClient()
    const certId = params.id

    // 1. Load the certification so we know what we're building.
    const { data: cert, error: certErr } = await admin
      .from('certifications')
      .select('id, name, description, difficulty')
      .eq('id', certId)
      .single()

    if (certErr || !cert) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      )
    }

    // 2. Wipe existing structure if regenerating. Cascade FKs handle the
    //    lesson/content rows.
    if (regenerate) {
      const { error: wipeErr } = await admin
        .from('cert_modules')
        .delete()
        .eq('cert_id', certId)
      if (wipeErr) {
        return NextResponse.json(
          { error: `Failed to wipe existing modules: ${wipeErr.message}` },
          { status: 500 }
        )
      }
    }

    // 3. Make sure modules exist. If not, ask the AI to plan the course.
    let { data: modules, error: modulesErr } = await admin
      .from('cert_modules')
      .select('id, title, description, estimated_hours, order_idx')
      .eq('cert_id', certId)
      .order('order_idx', { ascending: true })

    if (modulesErr) {
      return NextResponse.json({ error: modulesErr.message }, { status: 500 })
    }

    if (!modules || modules.length === 0) {
      try {
        const aiModules = await generateModulesForCert(
          cert.name,
          cert.description
        )
        if (aiModules.length === 0) {
          return NextResponse.json(
            { error: 'AI returned no modules for this certification.' },
            { status: 502 }
          )
        }

        const rowsToInsert = aiModules.map((m, idx) => ({
          cert_id: certId,
          title: (m.title || `Module ${idx + 1}`).slice(0, 200),
          description: m.description || null,
          estimated_hours: Math.max(
            1,
            Math.min(40, Number(m.estimated_hours) || 5)
          ),
          order_idx: typeof m.order_idx === 'number' ? m.order_idx : idx,
        }))

        const { data: insertedModules, error: insertErr } = await admin
          .from('cert_modules')
          .insert(rowsToInsert)
          .select('id, title, description, estimated_hours, order_idx')
          .order('order_idx', { ascending: true })

        if (insertErr || !insertedModules) {
          return NextResponse.json(
            { error: `Failed to save modules: ${insertErr?.message}` },
            { status: 500 }
          )
        }

        modules = insertedModules
      } catch (e: any) {
        return NextResponse.json(
          { error: `AI failed to plan modules: ${e.message || 'unknown'}` },
          { status: 502 }
        )
      }
    }

    // 4. For each module, plan + write its lessons in parallel.
    //    Modules that already have lessons are skipped — this keeps re-runs
    //    cheap and idempotent.
    const moduleResults = await Promise.allSettled(
      modules.map((mod) =>
        buildLessonsForModule(admin, cert.name, mod)
      )
    )

    let totalLessonsCreated = 0
    let totalContentBlocksCreated = 0
    const moduleSummaries = moduleResults.map((result, idx) => {
      const mod = modules![idx]
      if (result.status === 'fulfilled') {
        totalLessonsCreated += result.value.lessonsCreated
        totalContentBlocksCreated += result.value.contentBlocksCreated
        return {
          module_id: mod.id,
          module_title: mod.title,
          status: 'ok' as const,
          ...result.value,
        }
      }
      return {
        module_id: mod.id,
        module_title: mod.title,
        status: 'failed' as const,
        error: result.reason?.message || 'Unknown error',
      }
    })

    const failedCount = moduleSummaries.filter(
      (m) => m.status === 'failed'
    ).length

    return NextResponse.json({
      cert_id: certId,
      cert_name: cert.name,
      modules_count: modules.length,
      lessons_created: totalLessonsCreated,
      content_blocks_created: totalContentBlocksCreated,
      failed_modules: failedCount,
      modules: moduleSummaries,
      message:
        failedCount === 0
          ? `Built ${modules.length} module${modules.length === 1 ? '' : 's'} with ${totalLessonsCreated} lesson${totalLessonsCreated === 1 ? '' : 's'}.`
          : `Built ${modules.length - failedCount}/${modules.length} modules. ${failedCount} failed — try Regenerate to retry.`,
    })
  } catch (error: any) {
    console.error('POST /certifications/[id]/build error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to build course' },
      { status: 500 }
    )
  }
}

/**
 * Ask the AI to break a certification into ordered study modules. Mirrors
 * the logic from /api/ai/generate-modules but inlined so this endpoint can
 * make a single round-trip without an extra HTTP hop.
 */
async function generateModulesForCert(
  certName: string,
  certDescription: string | null
): Promise<AIModule[]> {
  const systemPrompt = `You are a senior curriculum designer specialising in professional certifications.

Plan a comprehensive study programme that mirrors what a real classroom or training provider would cover for this certification. Be exhaustive — anything on the official exam blueprint should appear as a module.

Respond with VALID JSON ONLY, no markdown, in exactly this shape:
{
  "modules": [
    {
      "title": "Module title (e.g. 'IAM and Access Management')",
      "description": "1-2 sentence description of what the module covers and which exam objectives it maps to.",
      "estimated_hours": 8,
      "order_idx": 0
    }
  ]
}

Constraints:
- 6–10 modules. Fewer is too shallow; more is overwhelming.
- Order them from foundational to advanced.
- estimated_hours is realistic seat-time, including reading + practice (typically 4–12 hours per module).`

  const userPrompt = `Certification: ${certName}
${certDescription ? `Description: ${certDescription}` : ''}

Break this certification into study modules that follow the official exam blueprint as closely as you can.`

  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  })

  const text = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(text)
  return Array.isArray(parsed.modules) ? parsed.modules : []
}

/**
 * For a single module, generate its lesson plan and then the full content for
 * every lesson in parallel. Skips modules that already have lessons.
 */
async function buildLessonsForModule(
  admin: ReturnType<typeof createAdminClient>,
  certName: string,
  mod: {
    id: string
    title: string
    description: string | null
    estimated_hours: number
  }
): Promise<{ lessonsCreated: number; contentBlocksCreated: number; skipped?: boolean }> {
  // Skip if the module already has lessons. Caller can pass regenerate=true
  // upstream to wipe everything first.
  const { data: existingLessons } = await admin
    .from('cert_lessons')
    .select('id')
    .eq('module_id', mod.id)
    .limit(1)

  if (existingLessons && existingLessons.length > 0) {
    return { lessonsCreated: 0, contentBlocksCreated: 0, skipped: true }
  }

  // Step 1: plan the lessons inside this module.
  const structure = await generateLessonStructure(
    mod.title,
    mod.description,
    mod.estimated_hours
  )

  if (!structure?.lessons?.length) {
    throw new Error(`AI returned no lessons for module "${mod.title}"`)
  }

  // Step 2: insert lesson rows in one batch.
  const lessonRows = structure.lessons.map((l, idx) => ({
    module_id: mod.id,
    title: l.title?.slice(0, 200) || `Lesson ${idx + 1}`,
    description: l.description || null,
    order_idx: typeof l.order === 'number' ? l.order : idx + 1,
    estimated_minutes: Math.max(
      5,
      Math.min(120, Number(l.estimated_minutes) || 20)
    ),
    difficulty_level: Math.max(1, Math.min(5, Number(l.difficulty) || 2)),
    ai_generated: true,
  }))

  const { data: insertedLessons, error: insertLessonsErr } = await admin
    .from('cert_lessons')
    .insert(lessonRows)
    .select()

  if (insertLessonsErr || !insertedLessons) {
    throw new Error(
      `Failed to insert lessons: ${insertLessonsErr?.message || 'unknown'}`
    )
  }

  // Step 3: generate full content for every lesson in parallel.
  const contentResults = await Promise.allSettled(
    insertedLessons.map((lesson) =>
      generateLessonContent({
        moduleTitle: mod.title,
        moduleDescription: mod.description ?? undefined,
        certificationName: certName,
        difficulty: lesson.difficulty_level,
        estimatedMinutes: lesson.estimated_minutes,
      }).then((content) => ({ lessonId: lesson.id, content }))
    )
  )

  // Step 4: flatten content rows and insert in one batch.
  const contentRows: any[] = []
  contentResults.forEach((result) => {
    if (result.status !== 'fulfilled') {
      console.error(
        `Lesson content gen failed in module ${mod.title}:`,
        result.reason?.message || result.reason
      )
      return
    }
    const { lessonId, content } = result.value
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
      // Lessons exist but content is incomplete — caller can regenerate.
      throw new Error(`Failed to insert lesson content: ${contentErr.message}`)
    }
  }

  return {
    lessonsCreated: insertedLessons.length,
    contentBlocksCreated: contentRows.length,
  }
}
