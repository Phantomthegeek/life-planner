import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLessonStructure, generateLessonContent } from '@/lib/ai/lesson-generator'

/**
 * GET: Fetch lessons for a module or certification
 * POST: Generate lessons for a module using AI
 */
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

    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('module_id')

    let query = supabase
      .from('cert_lessons')
      .select(`
        *,
        cert_modules!inner(cert_id),
        cert_lesson_content(*)
      `)
      .eq('cert_modules.cert_id', params.id)

    if (moduleId) {
      query = query.eq('module_id', moduleId)
    }

    const { data: lessons, error } = await query.order('order_idx', { ascending: true })

    if (error) throw error

    return NextResponse.json(lessons || [])
  } catch (error: any) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}

/**
 * POST: Generate lessons for a module using AI
 */
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

    const body = await request.json()
    const { module_id } = body

    if (!module_id) {
      return NextResponse.json(
        { error: 'module_id is required' },
        { status: 400 }
      )
    }

    // Fetch module details
    const { data: module, error: moduleError } = await supabase
      .from('cert_modules')
      .select('*, certifications(*)')
      .eq('id', module_id)
      .single()

    if (moduleError || !module) {
      throw new Error('Module not found')
    }

    // Generate lesson structure
    const structure = await generateLessonStructure(
      module.title,
      module.description,
      module.estimated_hours
    )

    // Create lessons in database
    const lessons = []
    for (const lessonData of structure.lessons) {
      const { data: lesson, error: lessonError } = await supabase
        .from('cert_lessons')
        .insert({
          module_id: module_id,
          title: lessonData.title,
          description: lessonData.description,
          order_idx: lessonData.order,
          estimated_minutes: lessonData.estimated_minutes,
          difficulty_level: lessonData.difficulty,
          ai_generated: true,
        })
        .select()
        .single()

      if (lessonError) {
        console.error('Error creating lesson:', lessonError)
        continue
      }

      // Generate lesson content
      try {
        const content = await generateLessonContent({
          moduleTitle: module.title,
          moduleDescription: module.description,
          certificationName: module.certifications?.name || 'Unknown',
          difficulty: lessonData.difficulty,
          estimatedMinutes: lessonData.estimated_minutes,
        })

        // Save lesson content
        await supabase
          .from('cert_lesson_content')
          .insert({
            lesson_id: lesson.id,
            content_type: 'intro',
            content_data: { intro: content.intro },
            ai_generated: true,
            generated_at: new Date().toISOString(),
          })

        await supabase
          .from('cert_lesson_content')
          .insert({
            lesson_id: lesson.id,
            content_type: 'concepts',
            content_data: { concepts: content.concepts },
            ai_generated: true,
            generated_at: new Date().toISOString(),
          })

        await supabase
          .from('cert_lesson_content')
          .insert({
            lesson_id: lesson.id,
            content_type: 'practical',
            content_data: { practical: content.practical },
            ai_generated: true,
            generated_at: new Date().toISOString(),
          })

        await supabase
          .from('cert_lesson_content')
          .insert({
            lesson_id: lesson.id,
            content_type: 'summary',
            content_data: { summary: content.summary },
            ai_generated: true,
            generated_at: new Date().toISOString(),
          })
      } catch (contentError) {
        console.error('Error generating lesson content:', contentError)
        // Continue even if content generation fails
      }

      lessons.push(lesson)
    }

    return NextResponse.json({ lessons, message: `Generated ${lessons.length} lessons` })
  } catch (error: any) {
    console.error('Error generating lessons:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate lessons' },
      { status: 500 }
    )
  }
}

