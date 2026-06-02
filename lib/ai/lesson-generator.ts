/**
 * AI Lesson Content Generator
 * Generates structured lesson content for certification modules
 */

import OpenAI from 'openai'
import { arcanaCore } from './personality'

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

  const difficultyLabel =
    options.difficulty <= 1
      ? 'Beginner'
      : options.difficulty >= 5
        ? 'Expert / postgraduate'
        : options.difficulty === 2
          ? 'Foundational'
          : options.difficulty === 3
            ? 'Intermediate'
            : 'Advanced'

  // Prompt is deliberately long. We want the AI to behave like a textbook
  // author, not a blog writer — formal definitions, derivations, worked
  // examples, mapped to the official exam blueprint. The user has explicitly
  // asked for lessons that match what a real classroom would teach, so we
  // demand that out loud and budget enough tokens for it.
  const prompt = `You are an experienced university lecturer and certified instructor writing a self-contained chapter of a textbook for the following certification programme. A student should be able to read this lesson alone and learn the material as well as they would in a real classroom or instructor-led training session.

Certification: ${options.certificationName}
Module: ${options.moduleTitle}
${options.moduleDescription ? `Module description: ${options.moduleDescription}` : ''}
Difficulty: ${options.difficulty}/5 (${difficultyLabel})
Estimated study time: ${options.estimatedMinutes} minutes

Mandatory standards:
- Match the depth and accuracy of the official syllabus or exam blueprint for "${options.certificationName}". If the cert has published objectives, weight your coverage to mirror them.
- Use formal definitions where applicable. Introduce the precise term, then explain it plainly. Include any standard notation, formulas, or canonical diagrams a textbook would include (described in prose).
- Cite the canonical sources, frameworks, RFCs, equations, or laws by name (e.g. "the AWS Well-Architected Framework", "RFC 5246", "Bloom's Taxonomy", "Section 230"). Do not invent citations.
- Where a topic has competing schools of thought or trade-offs, present both honestly.
- Every example should be a worked example: state the problem, walk through the reasoning step-by-step, end with the result and why it matters.

Structure (return as JSON exactly in the shape below):

1. INTRODUCTION
   - "overview": 4–6 sentences. State what the lesson covers, why it matters in the field, and how it fits into the broader certification objectives.
   - "learning_objectives": 5–7 specific, measurable objectives, each starting with a Bloom's-style verb (Define, Explain, Compare, Apply, Analyse, Evaluate, Design).
   - "key_takeaways": 5–7 concise statements of what the student must remember after completing the lesson.

2. CORE CONCEPTS (5–7 concepts — this is the bulk of the lesson)
   Each concept object has:
   - "title": precise topic name.
   - "explanation": **4–6 paragraphs** of rigorous prose. Open with the formal definition, then unpack the mechanics, then discuss when and why it applies. Use the same language a domain expert would use, but define every term the first time it appears. This is the section that should feel like a textbook chapter.
   - "examples": **3–5 worked examples**. Each is a 3–6 sentence mini case study: setup, reasoning, conclusion. Use realistic numbers, names, scenarios — never placeholders like "Company X".
   - "analogies": 1–2 carefully chosen analogies that genuinely illuminate the concept (no strained metaphors).

3. PRACTICAL APPLICATIONS
   - "real_world_scenarios": 4–6 detailed scenarios (2–4 sentences each) where this knowledge is applied in industry / on the exam.
   - "common_use_cases": 4–6 bullets, each one sentence.
   - "best_practices": 5–8 actionable best practices that a working professional would follow.

4. SUMMARY
   - "recap": a 4–6 sentence paragraph synthesising what was learned.
   - "key_points": 6–10 bullet points capturing the must-remember items.
   - "next_steps": 3–5 concrete suggestions for what to study next within the certification path.

Write at a level appropriate for the difficulty (currently ${difficultyLabel}). Adjust register accordingly: at lower levels, build intuition before formality; at higher levels, assume foundational knowledge and dive into nuance.

Return ONLY valid JSON in this exact structure (no markdown, no commentary):
{
  "intro": {
    "overview": "...",
    "learning_objectives": ["...", "..."],
    "key_takeaways": ["...", "..."]
  },
  "concepts": [
    {
      "title": "...",
      "explanation": "Paragraph 1...\\n\\nParagraph 2...\\n\\nParagraph 3...\\n\\nParagraph 4...",
      "examples": ["Worked example 1...", "Worked example 2...", "Worked example 3..."],
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
      // gpt-4o-mini gives us textbook-grade depth in JSON at a price point
      // that lets us afford full course builds. It also has a much larger
      // output window than gpt-3.5-turbo, which we need now that lessons are
      // multi-thousand words.
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${arcanaCore()}\n\nRight now you are an experienced subject-matter instructor writing rigorous, classroom-accurate lesson content. Match the depth of a university course or accredited training programme. Be specific, cite canonical sources by name, avoid filler, never hallucinate certifications or frameworks that don't exist. Always respond with valid JSON only, no markdown formatting.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      // Enough headroom for a full textbook-style lesson. gpt-4o-mini's
      // output cap is ~16k so we leave a comfortable buffer.
      max_tokens: 8000,
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

  const prompt = `You are designing the lesson plan for a module in an accredited certification programme. Match the structure that a published textbook or instructor-led course would use.

Module: ${moduleTitle}
${moduleDescription ? `Description: ${moduleDescription}` : ''}
Estimated total study time: ${estimatedHours} hours

Requirements:
- Produce 4–8 lessons that, together, cover every concept this module's name implies. Mirror the official exam blueprint where one exists.
- Order them strictly progressively: each lesson assumes only knowledge from previous lessons in this module (and earlier modules).
- Each lesson is a self-contained chapter of 25–45 minutes of careful reading and reflection.
- Title each lesson as a real chapter would be titled — descriptive, not cute.
- The description (1–2 sentences) names the specific sub-topics covered.
- Difficulty climbs gradually across the module (e.g. 2 → 2 → 3 → 3 → 4).

Return ONLY valid JSON in this structure:
{
  "lessons": [
    {
      "title": "Lesson title",
      "description": "Specific sub-topics covered",
      "order": 1,
      "estimated_minutes": 30,
      "difficulty": 2
    }
  ]
}`

  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${arcanaCore()}\n\nRight now you are an experienced curriculum designer planning a textbook-quality module for a certification. Build a clean, progressive sequence that mirrors the rigour of accredited training. Always respond with valid JSON only.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const structure: LessonStructure = JSON.parse(responseText)

    return structure
  } catch (error: any) {
    console.error('Error generating lesson structure:', error)
    throw new Error(`Failed to generate lesson structure: ${error.message || 'Unknown error'}`)
  }
}

