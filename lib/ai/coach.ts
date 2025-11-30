import OpenAI from 'openai'
import { AICoachResponse, Task, Habit } from '@/lib/types'
import { Database } from '@/lib/supabase/database.types'
import { buildContextBundle, AIContextBundle } from './context-builder'

// Check if API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('⚠️ OPENAI_API_KEY is not set in environment variables')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface UserPreferences {
  wake_time: string
  sleep_time: string
  work_hours_start: string
  work_hours_end: string
}

interface CoachPromptOptions {
  userPreferences: UserPreferences
  existingTasks: Task[]
  habits: Habit[]
  certifications: any[]
  mode?: 'normal' | 'light' | 'intense'
  date: string
}

export async function generateDailyPlan(
  options: CoachPromptOptions
): Promise<AICoachResponse> {
  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env.local file and restart the server.')
  }

  const {
    userPreferences,
    existingTasks,
    habits,
    certifications,
    mode = 'normal',
    date,
  } = options

  const systemPrompt = `You are an AI life coach and study planner. You help users create optimized daily schedules that balance work, study, habits, and rest.

You must always respond with valid JSON in this exact structure:
{
  "summary": "A brief 2-3 sentence summary of the day",
  "schedule": [
    {
      "start": "2025-03-19T09:00:00",
      "end": "2025-03-19T10:00:00",
      "title": "Task name",
      "category": "study|work|break|habit|personal",
      "notes": "Optional helpful notes"
    }
  ],
  "actions": ["Actionable item 1", "Actionable item 2"],
  "estimates": {
    "total_minutes": 480
  },
  "motivation": "An encouraging message"
}

Consider:
- User's wake time: ${userPreferences.wake_time}
- Sleep time: ${userPreferences.sleep_time}
- Work hours: ${userPreferences.work_hours_start} - ${userPreferences.work_hours_end}
- Energy levels (morning = high, afternoon = medium, evening = low)
- Existing tasks for the day
- Certification study goals
- Daily habits
- Work-life balance
- Mode: ${mode} (light = easier day, intense = challenging day)
- Leave buffer time between tasks
- Include breaks
- Schedule habits at appropriate times

Date: ${date}`

  const userPrompt = `Create my daily plan for ${date}.

Existing tasks already scheduled:
${JSON.stringify(
  existingTasks.map((t) => ({
    title: t.title,
    start: t.start_ts,
    end: t.end_ts,
    category: t.category,
  })),
  null,
  2
)}

Active habits:
${habits.map((h) => `- ${h.name} (${h.streak} day streak)`).join('\n')}

Active certifications:
${certifications
  .map((c) => `- ${c.name} (${c.progress}% complete)`)
  .join('\n')}

Mode: ${mode}

${mode === 'light' ? 'Make this day easier - fewer tasks, more breaks, focus on recovery.' : ''}
${mode === 'intense' ? 'Make this day more challenging - pack in more study time and productivity.' : ''}

Create an optimized schedule that fits within my preferences and includes time for my goals.`

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

    // Validate and transform response
    return {
      summary: parsed.summary || 'Your daily plan is ready!',
      schedule: Array.isArray(parsed.schedule) ? parsed.schedule : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      estimates: parsed.estimates || { total_minutes: 0 },
      motivation: parsed.motivation || "You've got this!",
    }
  } catch (error: any) {
    console.error('Error generating AI plan:', error)
    
    // Provide more specific error messages
    if (error?.message?.includes('API key')) {
      throw new Error('OpenAI API key is invalid or missing. Please check your .env.local file and restart the server.')
    }
    
    if (error?.status === 401 || error?.message?.includes('401')) {
      throw new Error('OpenAI API authentication failed. Please check your API key.')
    }
    
    // Rate limit error - provide helpful guidance
    if (error?.status === 429 || error?.message?.includes('429') || error?.code === 'rate_limit_exceeded') {
      const retryAfter = error?.headers?.['retry-after'] || error?.retryAfter
      const message = retryAfter 
        ? `OpenAI API rate limit exceeded. Please try again in ${retryAfter} seconds.`
        : `OpenAI API rate limit exceeded. This usually means:\n\n1. You're on the free tier with low limits (check: https://platform.openai.com/account/usage)\n2. You've hit daily/monthly limits\n3. Adding a payment method increases limits significantly\n\nPlease wait a few hours or check your OpenAI account status.`
      throw new Error(message)
    }
    
    if (error?.message?.includes('JSON')) {
      throw new Error('Failed to parse AI response. Please try again.')
    }
    
    // Check for quota/credit issues
    if (error?.message?.includes('insufficient_quota') || error?.code === 'insufficient_quota') {
      throw new Error('OpenAI account has insufficient credits. Please add credits at https://platform.openai.com/account/billing')
    }
    
    // Include the actual error message if available
    const errorMessage = error?.message || error?.error?.message || error?.code || 'Unknown error'
    throw new Error(`Failed to generate daily plan: ${errorMessage}`)
  }
}

