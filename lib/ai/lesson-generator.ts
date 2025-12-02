/**
 * AI Lesson Content Generator
 * Generates structured lesson content for certification modules
 */

import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

export interface LessonContent {
  intro: {
    overview: string
    learning_objectives: string[]
    key_takeaways: string[]
  }
  concepts: Array<{
    title: string
    explanation: string
    examples: string[]
    analogies: string[]
  }>
  practical: {
    real_world_scenarios: string[]
    common_use_cases: string[]
    best_practices: string[]
  }
  summary: {
    recap: string
    key_points: string[]
    next_steps: string[]
  }
  visuals?: {
    diagrams: Array<{
      type: string
      description: string
      data: any
    }>
  }
}

export interface GenerateLessonOptions {
  moduleTitle: string
  moduleDescription?: string
  certificationName: string
  difficulty: number // 1-5
  estimatedMinutes: number
  contentType?: 'introductory' | 'intermediate' | 'advanced'
}

export async function generateLessonContent(
  options: GenerateLessonOptions
): Promise<LessonContent> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured')
  }

  const prompt = `You are an expert course instructor creating comprehensive lesson content.

Certification: ${options.certificationName}
Module: ${options.moduleTitle}
${options.moduleDescription ? `Description: ${options.moduleDescription}` : ''}
Difficulty Level: ${options.difficulty}/5 (${options.difficulty === 1 ? 'Beginner' : options.difficulty === 5 ? 'Expert' : 'Intermediate'})
Estimated Time: ${options.estimatedMinutes} minutes

Create a structured lesson with the following sections:

1. **Introduction**
   - Overview paragraph (2-3 sentences explaining what this lesson covers)
   - 3-5 Learning objectives (clear, actionable)
   - 3-5 Key takeaways (what students will remember)

2. **Core Concepts** (3-5 concepts)
   Each concept should have:
   - Clear title
   - Detailed explanation (2-3 paragraphs, beginner-friendly)
   - 2-3 practical examples
   - 1-2 analogies to help understanding

3. **Practical Applications**
   - 3-5 Real-world scenarios where this knowledge is used
   - 3-5 Common use cases
   - 3-5 Best practices

4. **Summary**
   - Recap paragraph (what was covered)
   - Key points list (5-7 bullet points)
   - Next steps (what to learn next)

Make the content engaging, clear, and appropriate for the difficulty level. Use simple language, avoid jargon unless necessary, and always explain technical terms.

Return ONLY valid JSON in this exact structure:
{
  "intro": {
    "overview": "...",
    "learning_objectives": ["...", "..."],
    "key_takeaways": ["...", "..."]
  },
  "concepts": [
    {
      "title": "...",
      "explanation": "...",
      "examples": ["...", "..."],
      "analogies": ["...", "..."]
    }
  ],
  "practical": {
    "real_world_scenarios": ["...", "..."],
    "common_use_cases": ["...", "..."],
    "best_practices": ["...", "..."]
  },
  "summary": {
    "recap": "...",
    "key_points": ["...", "..."],
    "next_steps": ["...", "..."]
  }
}`

  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator. Always respond with valid JSON only, no markdown formatting.',
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
    const lessonContent: LessonContent = JSON.parse(responseText)

    return lessonContent
  } catch (error: any) {
    console.error('Error generating lesson content:', error)
    
    if (error?.message?.includes('API key')) {
      throw new Error('OpenAI API key is invalid or missing.')
    }
    if (error?.status === 429 || error?.message?.includes('429')) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.')
    }
    
    throw new Error(`Failed to generate lesson content: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Generate lesson structure (breakdown into lessons)
 */
export interface LessonStructure {
  lessons: Array<{
    title: string
    description: string
    order: number
    estimated_minutes: number
    difficulty: number
  }>
}

export async function generateLessonStructure(
  moduleTitle: string,
  moduleDescription: string | null,
  estimatedHours: number
): Promise<LessonStructure> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured')
  }

  const prompt = `Break down this module into structured lessons:

Module: ${moduleTitle}
${moduleDescription ? `Description: ${moduleDescription}` : ''}
Estimated Time: ${estimatedHours} hours

Create a logical sequence of lessons that cover all the material. Each lesson should be:
- Focused on a specific topic
- 10-30 minutes in length
- Progressively building on previous lessons
- Clear title and description

Return ONLY valid JSON in this structure:
{
  "lessons": [
    {
      "title": "Lesson Title",
      "description": "What this lesson covers",
      "order": 1,
      "estimated_minutes": 15,
      "difficulty": 2
    }
  ]
}`

  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert curriculum designer. Always respond with valid JSON only.',
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
    const structure: LessonStructure = JSON.parse(responseText)

    return structure
  } catch (error: any) {
    console.error('Error generating lesson structure:', error)
    throw new Error(`Failed to generate lesson structure: ${error.message || 'Unknown error'}`)
  }
}

