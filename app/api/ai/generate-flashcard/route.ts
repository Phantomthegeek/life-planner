import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { topic, conversation_id } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    // Generate flashcard using AI
    const prompt = `Create a flashcard for the topic: "${topic}"

Return a JSON object with this structure:
{
  "front": "Question or term",
  "back": "Answer or definition",
  "category": "Category name"
}

Make it clear, concise, and educational.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful educational assistant. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const flashcard = JSON.parse(responseText)

    // Save flashcard to database if conversation_id provided
    if (conversation_id) {
      await supabase
        .from('chat_flashcards')
        .insert({
          user_id: user.id,
          conversation_id,
          front: flashcard.front,
          back: flashcard.back,
          category: flashcard.category || 'general',
        })
    }

    return NextResponse.json(flashcard)
  } catch (error: any) {
    console.error('Error generating flashcard:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

