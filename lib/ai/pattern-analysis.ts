import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface PatternAnalysis {
  productivityPatterns: string[]
  timePatterns: string[]
  habitPatterns: string[]
  taskPatterns: string[]
  recommendations: string[]
  insights: string[]
}

export async function analyzePatterns(
  tasks: Array<{
    title: string
    date: string
    done: boolean
    category: string
    duration_minutes?: number
  }>,
  habits: Array<{
    name: string
    streak: number
    frequency: string
  }>,
  notes: Array<{
    date: string
    content: string
  }>
): Promise<PatternAnalysis> {
  const systemPrompt = `You are an AI analyst that identifies patterns in user behavior, productivity, and habits.

Respond with valid JSON:
{
  "productivityPatterns": ["Pattern 1", "Pattern 2"],
  "timePatterns": ["Time pattern 1"],
  "habitPatterns": ["Habit pattern 1"],
  "taskPatterns": ["Task pattern 1"],
  "recommendations": ["Recommendation 1"],
  "insights": ["Insight 1"]
}`

  const taskCompletionRate =
    tasks.length > 0
      ? (tasks.filter((t) => t.done).length / tasks.length) * 100
      : 0

  const avgTaskDuration =
    tasks.filter((t) => t.duration_minutes).length > 0
      ? tasks
          .filter((t) => t.duration_minutes)
          .reduce((sum, t) => sum + (t.duration_minutes || 0), 0) /
        tasks.filter((t) => t.duration_minutes).length
      : 0

  const categoryBreakdown = tasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const userPrompt = `Analyze these user patterns:

TASK STATISTICS:
- Total tasks: ${tasks.length}
- Completion rate: ${taskCompletionRate.toFixed(1)}%
- Average duration: ${avgTaskDuration.toFixed(0)} minutes
- Category breakdown: ${JSON.stringify(categoryBreakdown)}

HABITS:
${habits.map((h) => `${h.name}: ${h.streak} day streak, ${h.frequency}`).join('\n') || 'No habits tracked'}

NOTES:
${notes.length} notes logged

Analyze patterns and provide actionable insights.`

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

    return {
      productivityPatterns: Array.isArray(parsed.productivityPatterns)
        ? parsed.productivityPatterns
        : [],
      timePatterns: Array.isArray(parsed.timePatterns) ? parsed.timePatterns : [],
      habitPatterns: Array.isArray(parsed.habitPatterns) ? parsed.habitPatterns : [],
      taskPatterns: Array.isArray(parsed.taskPatterns) ? parsed.taskPatterns : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [],
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
    }
  } catch (error) {
    console.error('Error analyzing patterns:', error)
    throw new Error('Failed to analyze patterns')
  }
}

