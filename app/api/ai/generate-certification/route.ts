import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { certificationName, field } = body

    if (!certificationName && !field) {
      return NextResponse.json(
        { error: 'Certification name or field is required' },
        { status: 400 }
      )
    }

    const prompt = certificationName
      ? `Generate certification details for: ${certificationName}`
      : `Generate a popular IT certification for the field: ${field}`

    const systemPrompt = `You are an expert on IT certifications. Generate detailed information about certifications.

Respond with valid JSON in this exact structure:
{
  "slug": "certification-slug-url-friendly",
  "name": "Full Certification Name",
  "description": "Detailed description of what this certification covers (2-3 sentences)",
  "difficulty": 3
}

Difficulty scale: 1=Very Easy, 2=Easy, 3=Medium, 4=Hard, 5=Very Hard

For the slug, convert the name to lowercase, replace spaces with hyphens, remove special characters.

Examples:
- "AWS Solutions Architect" → slug: "aws-solutions-architect"
- "CompTIA Security+" → slug: "comptia-security-plus"`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const certification = JSON.parse(responseText)

    // Validate response
    if (!certification.slug || !certification.name) {
      throw new Error('Invalid certification data from AI')
    }

    return NextResponse.json(certification)
  } catch (error: any) {
    console.error('Error generating certification:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate certification' },
      { status: 500 }
    )
  }
}

