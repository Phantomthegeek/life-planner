import OpenAI from 'openai'

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
  const systemPrompt = `You are an AI assistant that summarizes journal entries and notes. Extract key insights, themes, and actionable items.

Respond with valid JSON:
{
  "summary": "Brief 2-3 sentence summary",
  "keyPoints": ["Point 1", "Point 2"],
  "insights": ["Insight 1", "Insight 2"],
  "actionItems": ["Action 1", "Action 2"],
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
  const systemPrompt = `You are an AI life coach that provides weekly reviews. Analyze patterns, achievements, challenges, and provide actionable recommendations.

Respond with valid JSON:
{
  "summary": "Weekly overview",
  "achievements": ["Achievement 1"],
  "challenges": ["Challenge 1"],
  "patterns": ["Pattern observation"],
  "recommendations": ["Recommendation 1"],
  "nextWeekFocus": ["Focus area 1"]
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

