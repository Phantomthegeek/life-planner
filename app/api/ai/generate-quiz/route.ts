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

    // Generate quiz using AI
    const prompt = `Create a multiple choice quiz question for the topic: "${topic}"

Return a JSON object with this structure:
{
  "question": "The question text",
  "options": [
    {"text": "Option 1", "isCorrect": false},
    {"text": "Option 2", "isCorrect": true},
    {"text": "Option 3", "isCorrect": false},
    {"text": "Option 4", "isCorrect": false}
  ],
  "explanation": "Brief explanation of the correct answer"
}

Make it educational and clear.`

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
    const quiz = JSON.parse(responseText)

    // Save quiz to database if conversation_id provided
    if (conversation_id) {
      const correctIndex = quiz.options?.findIndex((opt: any) => opt.isCorrect) || 0
      await supabase
        .from('chat_quizzes')
        .insert({
          user_id: user.id,
          conversation_id,
          question: quiz.question,
          options: quiz.options?.map((opt: any) => opt.text) || [],
          correct_answer: correctIndex,
          explanation: quiz.explanation,
        })
    }

    return NextResponse.json(quiz)
  } catch (error: any) {
    console.error('Error generating quiz:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

