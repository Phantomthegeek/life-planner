/**
 * AI Quiz Generator
 * Generates quiz questions for lessons/modules
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface QuizQuestion {
  question: string
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'scenario'
  options?: string[] // For multiple choice
  correct_answer: string
  explanation: string
  difficulty_level: number
}

export interface Quiz {
  title: string
  description: string
  questions: QuizQuestion[]
}

export interface GenerateQuizOptions {
  moduleTitle: string
  moduleDescription?: string
  lessonTitle?: string
  lessonContent?: string
  difficulty: number // 1-5
  numQuestions: number
  questionTypes?: Array<'multiple_choice' | 'true_false' | 'fill_blank' | 'scenario'>
}

export async function generateQuiz(
  options: GenerateQuizOptions
): Promise<Quiz> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured')
  }

  const questionTypes = options.questionTypes || ['multiple_choice', 'true_false']
  const questionTypesStr = questionTypes.join(', ')

  const prompt = `You are an expert quiz creator. Generate ${options.numQuestions} quiz questions about:

Module: ${options.moduleTitle}
${options.moduleDescription ? `Description: ${options.moduleDescription}` : ''}
${options.lessonTitle ? `Lesson: ${options.lessonTitle}` : ''}
Difficulty Level: ${options.difficulty}/5

Requirements:
- Use question types: ${questionTypesStr}
- Mix question types appropriately
- Questions should test understanding, not just memorization
- Include real-world scenarios when possible
- Difficulty should match the level (${options.difficulty}/5)
- For multiple choice: 4 options, only 1 correct
- For true/false: make sure both options are plausible
- For fill-in: provide clear context

For each question, provide:
- The question text
- Question type
- Options (for multiple choice)
- Correct answer
- Explanation (why this answer is correct)
- Difficulty level (1-5)

Return ONLY valid JSON in this structure:
{
  "title": "Quiz Title",
  "description": "Brief quiz description",
  "questions": [
    {
      "question": "Question text?",
      "question_type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Explanation of why Option A is correct",
      "difficulty_level": 2
    }
  ]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert quiz creator. Always respond with valid JSON only, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8, // Higher temperature for variety
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const quiz: Quiz = JSON.parse(responseText)

    // Validate and ensure we have the right number of questions
    if (!quiz.questions || quiz.questions.length !== options.numQuestions) {
      console.warn(`Generated ${quiz.questions?.length || 0} questions, expected ${options.numQuestions}`)
    }

    return quiz
  } catch (error: any) {
    console.error('Error generating quiz:', error)
    
    if (error?.message?.includes('API key')) {
      throw new Error('OpenAI API key is invalid or missing.')
    }
    if (error?.status === 429 || error?.message?.includes('429')) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.')
    }
    
    throw new Error(`Failed to generate quiz: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Generate flashcards from module/lesson content
 */
export interface Flashcard {
  front: string
  back: string
  category: string
  difficulty_level: number
}

export interface GenerateFlashcardsOptions {
  moduleTitle: string
  moduleDescription?: string
  lessonContent?: string
  numCards: number
  difficulty: number
}

export async function generateFlashcards(
  options: GenerateFlashcardsOptions
): Promise<Flashcard[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured')
  }

  const prompt = `Create ${options.numCards} flashcards for:

Module: ${options.moduleTitle}
${options.moduleDescription ? `Description: ${options.moduleDescription}` : ''}
Difficulty Level: ${options.difficulty}/5

Each flashcard should have:
- Front: Question, term, or concept prompt
- Back: Clear, concise answer or definition
- Category: Topic area (e.g., "Concepts", "Definitions", "Best Practices")
- Difficulty: 1-5 scale

Focus on:
- Key terms and definitions
- Important concepts
- Common scenarios
- Best practices
- Common mistakes to avoid

Make cards suitable for spaced repetition learning.

Return ONLY valid JSON in this structure:
{
  "flashcards": [
    {
      "front": "Question or term",
      "back": "Answer or definition",
      "category": "Category name",
      "difficulty_level": 2
    }
  ]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator specializing in flashcards. Always respond with valid JSON only.',
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
    const result = JSON.parse(responseText)
    
    return result.flashcards || []
  } catch (error: any) {
    console.error('Error generating flashcards:', error)
    
    if (error?.message?.includes('API key')) {
      throw new Error('OpenAI API key is invalid or missing.')
    }
    if (error?.status === 429 || error?.message?.includes('429')) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.')
    }
    
    throw new Error(`Failed to generate flashcards: ${error.message || 'Unknown error'}`)
  }
}

