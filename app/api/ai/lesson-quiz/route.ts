import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { arcanaCore } from '@/lib/ai/personality'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

/**
 * Generate a multiple-choice quiz for a single lesson (default 10 questions).
 * Returns questions in the shape expected by <QuizInterface />.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      lesson_title,
      lesson_description,
      certification_name,
      difficulty = 2,
      num_questions = 10,
    } = body as {
      lesson_title?: string
      lesson_description?: string
      certification_name?: string
      difficulty?: number
      num_questions?: number
    }

    if (!lesson_title) {
      return NextResponse.json(
        { error: 'lesson_title is required' },
        { status: 400 }
      )
    }

    const prompt = `Generate exactly ${num_questions} multiple-choice quiz questions for this lesson.

Certification: ${certification_name || 'general'}
Lesson: ${lesson_title}
${lesson_description ? `Description: ${lesson_description}` : ''}
Difficulty: ${difficulty}/5

Rules:
- Match the academic rigour of a real classroom exam on this topic — questions should reflect what an instructor would actually ask.
- Each question must test understanding and application, not just recall. Mix in scenario / case-based questions.
- Exactly 4 options per question, only one correct. Distractors must be plausible (common misconceptions, not absurd).
- The "correct_answer" field MUST be the FULL TEXT of the correct option, not an index or letter.
- Explanations are 2-3 sentences and explain WHY the correct answer is correct AND why at least one distractor is wrong.
- Spread difficulty around the requested level: a handful easier, most at level, a few harder.
- Cover the full breadth of the lesson — don't cluster all questions on one sub-topic.

Respond with VALID JSON ONLY, no markdown, in exactly this shape:
{
  "questions": [
    {
      "question": "...",
      "question_type": "multiple_choice",
      "options": ["A text", "B text", "C text", "D text"],
      "correct_answer": "Exact text of the correct option",
      "explanation": "Short explanation",
      "difficulty_level": ${difficulty}
    }
  ]
}`

    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      // gpt-4o-mini handles longer JSON quizzes more reliably than 3.5-turbo
      // at comparable cost.
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${arcanaCore()}\n\nRight now you are writing a quiz for the user. Match what an instructor would set in a real classroom for this topic. Be precise and fair — no trick questions, no ambiguous options.`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 4096,
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(responseText)
    const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : []

    const questions = rawQuestions
      .map((q: any, idx: number) => ({
        id: `q-${idx}-${Date.now()}`,
        question: String(q.question || ''),
        question_type: 'multiple_choice' as const,
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        correct_answer: String(q.correct_answer || ''),
        explanation: String(q.explanation || ''),
        difficulty_level: Number(q.difficulty_level) || difficulty,
      }))
      .filter(
        (q: any) =>
          q.question &&
          q.options.length === 4 &&
          q.options.includes(q.correct_answer)
      )

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'AI returned no valid questions. Try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Error generating lesson quiz:', error)

    if (error?.status === 429 || error?.message?.includes('429')) {
      return NextResponse.json(
        { error: 'OpenAI rate limit hit. Try again in a moment.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}
