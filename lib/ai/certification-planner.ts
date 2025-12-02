import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

interface StudyPlanItem {
  date: string
  module_id: string
  module_title: string
  duration_minutes: number
  study_method: 'video' | 'reading' | 'practice' | 'review'
  notes: string
}

interface CertificationStudyPlan {
  cert_id: string
  cert_name: string
  total_hours: number
  weeks_to_completion: number
  study_schedule: StudyPlanItem[]
  weekly_breakdown: Array<{
    week: number
    hours: number
    modules: string[]
    focus: string
  }>
  recommendations: string[]
}

interface CertificationStudyPlanOptions {
  cert_id: string
  cert_name: string
  modules: Array<{
    id: string
    title: string
    estimated_hours: number
    description?: string
  }>
  current_progress: number
  target_date?: string
  hours_per_week: number
  start_date: string
}

export async function generateCertificationStudyPlan(
  options: CertificationStudyPlanOptions
): Promise<CertificationStudyPlan> {
  const {
    cert_id,
    cert_name,
    modules,
    current_progress,
    target_date,
    hours_per_week,
    start_date,
  } = options

  const totalHours = modules.reduce((sum, m) => sum + m.estimated_hours, 0)
  const remainingHours = totalHours * (1 - current_progress / 100)
  const weeksNeeded = Math.ceil(remainingHours / hours_per_week)

  const systemPrompt = `You are an expert study planner specializing in IT certifications. You create detailed, realistic study plans that optimize learning and retention.

You must respond with valid JSON in this exact structure:
{
  "cert_id": "uuid",
  "cert_name": "Certification Name",
  "total_hours": 100,
  "weeks_to_completion": 8,
  "study_schedule": [
    {
      "date": "2025-03-19",
      "module_id": "uuid",
      "module_title": "Module Name",
      "duration_minutes": 90,
      "study_method": "video|reading|practice|review",
      "notes": "Study tips and focus areas"
    }
  ],
  "weekly_breakdown": [
    {
      "week": 1,
      "hours": 10,
      "modules": ["Module 1", "Module 2"],
      "focus": "What to focus on this week"
    }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}

Consider:
- Spaced repetition (review previous modules)
- Difficulty progression (easier to harder)
- Balanced study methods (mix video, reading, practice)
- Realistic time allocation
- Buffer time for unexpected delays
- Exam preparation time
- Target date if provided
- Current progress level`

  const userPrompt = `Create a comprehensive study plan for ${cert_name}.

Modules to cover:
${modules.map((m, i) => 
  `${i + 1}. ${m.title} (${m.estimated_hours} hours estimated)${m.description ? ` - ${m.description}` : ''}`
).join('\n')}

Current progress: ${current_progress}%
Target date: ${target_date || 'Flexible'}
Study hours per week: ${hours_per_week}
Start date: ${start_date}
Remaining hours: ${remainingHours.toFixed(1)}
Weeks to completion: ${weeksNeeded}

Create a detailed study schedule that:
1. Breaks down modules into daily study sessions
2. Uses spaced repetition for better retention
3. Mixes study methods (video, reading, practice)
4. Includes review sessions for previous modules
5. Progresses logically from basics to advanced
6. Allocates time for exam preparation
7. Is realistic and achievable

Generate the complete study plan with daily study items.`

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

    // Validate and structure response
    return {
      cert_id: parsed.cert_id || cert_id,
      cert_name: parsed.cert_name || cert_name,
      total_hours: parsed.total_hours || totalHours,
      weeks_to_completion: parsed.weeks_to_completion || weeksNeeded,
      study_schedule: Array.isArray(parsed.study_schedule) 
        ? parsed.study_schedule 
        : generateFallbackSchedule(modules, start_date, hours_per_week),
      weekly_breakdown: Array.isArray(parsed.weekly_breakdown)
        ? parsed.weekly_breakdown
        : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [],
    }
  } catch (error) {
    console.error('Error generating certification study plan:', error)
    // Fallback to basic schedule
    return {
      cert_id,
      cert_name,
      total_hours,
      weeks_to_completion: weeksNeeded,
      study_schedule: generateFallbackSchedule(modules, start_date, hours_per_week),
      weekly_breakdown: [],
      recommendations: [
        'Study consistently every day',
        'Review previous modules weekly',
        'Take practice exams before the real test',
      ],
    }
  }
}

function generateFallbackSchedule(
  modules: Array<{ id: string; title: string; estimated_hours: number }>,
  startDate: string,
  hoursPerWeek: number
): StudyPlanItem[] {
  const schedule: StudyPlanItem[] = []
  let currentDate = new Date(startDate)
  const hoursPerDay = hoursPerWeek / 7

  modules.forEach((module, idx) => {
    const daysNeeded = Math.ceil(module.estimated_hours / hoursPerDay)
    
    for (let day = 0; day < daysNeeded; day++) {
      const studyDate = new Date(currentDate)
      studyDate.setDate(studyDate.getDate() + (idx * 2) + day)
      
      schedule.push({
        date: studyDate.toISOString().split('T')[0],
        module_id: module.id,
        module_title: module.title,
        duration_minutes: Math.round(hoursPerDay * 60),
        study_method: day === 0 ? 'video' : day === daysNeeded - 1 ? 'practice' : 'reading',
        notes: `Study ${module.title} - Day ${day + 1}`,
      })
    }
  })

  return schedule
}

