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
    const { cert_id, cert_name, cert_description } = body

    if (!cert_id || !cert_name) {
      return NextResponse.json(
        { error: 'Certification ID and name are required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert on IT certifications. Break down certifications into logical study modules.

Respond with valid JSON in this exact structure:
{
  "modules": [
    {
      "title": "Module Title",
      "description": "What this module covers (1-2 sentences)",
      "estimated_hours": 10,
      "order_idx": 0
    }
  ]
}

Create 5-10 modules that cover all aspects of the certification. Order them logically from basics to advanced.
Each module should represent a distinct topic or skill area.`

    const userPrompt = `Break down the certification "${cert_name}"${cert_description ? `: ${cert_description}` : ''} into study modules.

Create modules that cover all the exam objectives and topics. Order them from foundational concepts to advanced topics.
Each module should be a distinct learning unit that can be studied independently.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })

      const responseText = completion.choices[0]?.message?.content || '{}'
      const parsed = JSON.parse(responseText)

      if (!Array.isArray(parsed.modules)) {
        throw new Error('Invalid module structure from AI')
      }

      // Save modules to database
      const modulesToInsert = parsed.modules.map((module: any, idx: number) => ({
        cert_id,
        title: module.title || `Module ${idx + 1}`,
        description: module.description || null,
        estimated_hours: module.estimated_hours || 5,
        order_idx: module.order_idx !== undefined ? module.order_idx : idx,
      }))

      const { data: modules, error: insertError } = await supabase
        .from('cert_modules')
        .insert(modulesToInsert)
        .select()

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 400 }
        )
      }

      return NextResponse.json({ modules: modules || [] })
    } catch (aiError: any) {
      console.error('Error generating modules with AI:', aiError)
      throw new Error('Failed to generate modules with AI')
    }
  } catch (error: any) {
    console.error('Error in generate modules route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

