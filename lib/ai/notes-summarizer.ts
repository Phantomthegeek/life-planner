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

export interface NoteSummary {
  summary: string
  keyPoints: string[]
  insights: string[]
  actionItems: string[]
  mood?: string
  themes: string[]
}

export interface WeeklyReview {
  summary: string
  achievements: string[]
  challenges: string[]
  patterns: string[]
  recommendations: string[]
  nextWeekFocus: string[]
}

export async function summarizeNote(content: string): Promise<NoteSummary> {
  const systemPrompt = `${arcanaCore()}

Right now you are summarizing one of the user's notes. Pull out what actually matters — themes, decisions, things they might want to act on later. Avoid restating the note verbatim.

Respond with VALID JSON in exactly this shape:
{
  "summary": "Brief 2-3 sentence summary in your normal voice.",
  "keyPoints": ["Point 1", "Point 2"],
  "insights": ["Non-obvious observation 1"],
  "actionItems": ["Concrete next step 1"],
  "mood": "positive|neutral|negative|mixed",
  "themes": ["theme1", "theme2"]
}`

  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Summarize this note:\n\n${content}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(responseText)

    return {
      summary: parsed.summary || '',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      mood: parsed.mood || 'neutral',
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    }
  } catch (error) {
    console.error('Error summarizing note:', error)
    throw new Error('Failed to summarize note')
  }
}

export async function generateWeeklyReview(
  notes: Array<{ date: string; content: string }>,
  tasks: Array<{ title: string; done: boolean }>,
  habits: Array<{ name: string; streak: number }>
): Promise<WeeklyReview> {
  const systemPrompt = `${arcanaCore()}

Right now you are running the user's weekly review. Be honest about what went well, what didn't, and what to change. No motivational fluff.

Respond with VALID JSON in exactly this shape:
{
  "summary": "Weekly overview in your normal voice, addressing the user as 'you'.",
  "achievements": ["Real wins, not participation trophies"],
  "challenges": ["What got in the way"],
  "patterns": ["Specific pattern observation — e.g. 'tasks scheduled after 4pm rarely get done'"],
  "recommendations": ["One concrete change to try next week"],
  "nextWeekFocus": ["1-2 focus areas, not a wishlist"]
}`

  const notesText = notes.map((n) => `${n.date}: ${n.content}`).join('\n\n')
  const tasksCompleted = tasks.filter((t) => t.done).length
  const totalTasks = tasks.length
  const habitsInfo = habits.map((h) => `${h.name}: ${h.streak} day streak`).join('\n')

  const userPrompt = `Analyze this week's data:

Notes:
${notesText || 'No notes this week'}

Tasks: ${tasksCompleted}/${totalTasks} completed
Habits: ${habitsInfo || 'No habits tracked'}

Provide a comprehensive weekly review with insights and recommendations.`

  try {
    const openai = getOpenAIClient()
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

    return {
      summary: parsed.summary || 'Weekly review summary',
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      challenges: Array.isArray(parsed.challenges) ? parsed.challenges : [],
      patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      nextWeekFocus: Array.isArray(parsed.nextWeekFocus) ? parsed.nextWeekFocus : [],
    }
  } catch (error) {
    console.error('Error generating weekly review:', error)
    throw new Error('Failed to generate weekly review')
  }
}

