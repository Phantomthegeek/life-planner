import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy initialization to avoid build-time errors
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Use AI to parse natural language into structured task
    const systemPrompt = `You are a task parsing assistant. Parse natural language task descriptions into structured JSON.

Return ONLY valid JSON in this exact format:
{
  "title": "Task title",
  "detail": "Optional description",
  "date": "YYYY-MM-DD",
  "start_time": "HH:MM" (optional, 24-hour format),
  "duration_minutes": number (optional),
  "category": "work|study|personal|health|other",
  "confidence": 0.0-1.0
}

Examples:
"Study for exam next Friday at 2pm" -> {"title": "Study for exam", "date": "2025-01-XX", "start_time": "14:00", "category": "study", "confidence": 0.9}
"Call mom tomorrow" -> {"title": "Call mom", "date": "2025-01-XX", "category": "personal", "confidence": 0.8}
"Gym session for 1 hour" -> {"title": "Gym session", "duration_minutes": 60, "category": "health", "confidence": 0.7}

Today's date: ${new Date().toISOString().split('T')[0]}`

    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(responseText)

    // Validate and clean up the response
    const result = {
      title: parsed.title || text,
      detail: parsed.detail || null,
      date: parsed.date || new Date().toISOString().split('T')[0],
      start_time: parsed.start_time || null,
      duration_minutes: parsed.duration_minutes || 60,
      category: parsed.category || 'other',
      confidence: parsed.confidence || 0.5,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error parsing natural language:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to parse task' },
      { status: 500 }
    )
  }
}

