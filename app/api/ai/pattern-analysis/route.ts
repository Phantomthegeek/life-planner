import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzePatterns } from '@/lib/ai/pattern-analysis'
import { subDays, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { days = 30 } = body

    const startDate = formatDate(subDays(new Date(), days))
    const endDate = formatDate(new Date())

    // Fetch tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, date, done, category, duration_minutes')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)

    // Fetch habits
    const { data: habits } = await supabase
      .from('habits')
      .select('name, streak, frequency')
      .eq('user_id', user.id)

    // Fetch notes
    const { data: notes } = await supabase
      .from('notes')
      .select('date, content')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .limit(50) // Limit to recent notes

    // Analyze patterns
    const analysis = await analyzePatterns(
      (tasks || []).map((t) => ({
        title: t.title,
        date: t.date,
        done: t.done,
        category: t.category || 'general',
        duration_minutes: t.duration_minutes,
      })),
      (habits || []).map((h) => ({
        name: h.name,
        streak: h.streak || 0,
        frequency: h.frequency || 'daily',
      })),
      (notes || []).map((n) => ({
        date: n.date,
        content: n.content,
      }))
    )

    // Save AI query
    await supabase.from('ai_queries').insert({
      user_id: user.id,
      prompt: {
        type: 'pattern_analysis',
        days,
        start_date: startDate,
        end_date: endDate,
      },
      response: analysis,
    })

    return NextResponse.json({
      ...analysis,
      period: { start: startDate, end: endDate, days },
    })
  } catch (error) {
    console.error('Error analyzing patterns:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

