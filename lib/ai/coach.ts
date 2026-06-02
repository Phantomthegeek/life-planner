import OpenAI from 'openai'
import { AICoachResponse, Task, Habit } from '@/lib/types'
import { arcanaCore } from './personality'

// Constructed on first call instead of at import time so `next build` doesn't
// blow up in environments where OPENAI_API_KEY isn't set (CI, Vercel preview
// before envs are wired, etc.).
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

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

  const systemPrompt = `${arcanaCore()}

Right now you are acting as the user's day planner. Design a schedule they can actually follow today.

Respond with VALID JSON in exactly this shape (no extra fields, no prose outside JSON):
{
  "summary": "2-3 sentence overview written in your normal voice, addressing the user directly.",
  "schedule": [
    {
      "start": "${date}T09:00:00",
      "end": "${date}T10:00:00",
      "title": "Short, specific task name",
      "category": "study|work|break|habit|personal",
      "notes": "Optional one-sentence tip"
    }
  ],
  "actions": ["Optional list of one-off action items not on the schedule"],
  "estimates": { "total_minutes": 480 },
  "motivation": "One short, sincere line. No clichés. No exclamation marks unless it really earns one."
}

Rules:
- Respect their wake time ${userPreferences.wake_time} and sleep time ${userPreferences.sleep_time}.
- Heavy focus work happens inside ${userPreferences.work_hours_start}–${userPreferences.work_hours_end}.
- Morning = high energy, afternoon = medium, evening = low.
- Leave a small buffer between blocks. Include real breaks.
- Schedule habits at sensible times (e.g. workout pre-work, reading evening).
- Mode "${mode}": light = fewer blocks and longer breaks; intense = denser deep-work; normal = balanced.
- All timestamps must be on ${date}.`

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
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(responseText)

    // Defaults guard against the model omitting fields. The UI assumes these
    // shapes exist; we'd rather render a thin plan than crash.
    return {
      summary: parsed.summary || 'Your daily plan is ready!',
      schedule: Array.isArray(parsed.schedule) ? parsed.schedule : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      estimates: parsed.estimates || { total_minutes: 0 },
      motivation: parsed.motivation || "You've got this!",
    }
  } catch (error: any) {
    console.error('Error generating AI plan:', error)

    // Translate OpenAI's various failure modes into actionable user-facing
    // messages. Don't leak stack traces or model names; just tell the user
    // what to do next.
    if (error?.message?.includes('API key')) {
      throw new Error(
        'OpenAI API key is invalid or missing. Please check your .env.local file and restart the server.'
      )
    }

    if (error?.status === 401 || error?.message?.includes('401')) {
      throw new Error('OpenAI API authentication failed. Please check your API key.')
    }

    if (
      error?.status === 429 ||
      error?.message?.includes('429') ||
      error?.code === 'rate_limit_exceeded'
    ) {
      // OpenAI sometimes returns a Retry-After header; surface it so the user
      // knows whether to wait 30s or come back tomorrow.
      const retryAfter = error?.headers?.['retry-after'] || error?.retryAfter
      const message = retryAfter
        ? `OpenAI API rate limit exceeded. Please try again in ${retryAfter} seconds.`
        : `OpenAI API rate limit exceeded. This usually means:\n\n1. You're on the free tier with low limits (check: https://platform.openai.com/account/usage)\n2. You've hit daily/monthly limits\n3. Adding a payment method increases limits significantly\n\nPlease wait a few hours or check your OpenAI account status.`
      throw new Error(message)
    }

    if (error?.message?.includes('JSON')) {
      throw new Error('Failed to parse AI response. Please try again.')
    }

    if (
      error?.message?.includes('insufficient_quota') ||
      error?.code === 'insufficient_quota'
    ) {
      throw new Error(
        'OpenAI account has insufficient credits. Please add credits at https://platform.openai.com/account/billing'
      )
    }

    const errorMessage =
      error?.message || error?.error?.message || error?.code || 'Unknown error'
    throw new Error(`Failed to generate daily plan: ${errorMessage}`)
  }
}

