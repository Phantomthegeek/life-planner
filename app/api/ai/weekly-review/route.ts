import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklyReview } from '@/lib/ai/notes-summarizer'
import { formatDate, addDays, subDays } from '@/lib/utils'

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
    const { week_start_date } = body

    // Calculate week dates
    const startDate = week_start_date 
      ? new Date(week_start_date)
      : subDays(new Date(), 7)
    const endDate = addDays(startDate, 6)
    const startDateStr = formatDate(startDate)
    const endDateStr = formatDate(endDate)

    // Fetch notes for the week
    const { data: notes } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true })

    // Fetch tasks for the week
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, done')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .lte('date', endDateStr)

    // Fetch habits
    const { data: habits } = await supabase
      .from('habits')
      .select('name, streak')
      .eq('user_id', user.id)

    // Generate weekly review
    const review = await generateWeeklyReview(
      (notes || []).map((n) => ({ date: n.date, content: n.content })),
      (tasks || []).map((t) => ({ title: t.title, done: t.done })),
      (habits || []).map((h) => ({ name: h.name, streak: h.streak }))
    )

    // Save AI query
    await supabase.from('ai_queries').insert({
      user_id: user.id,
      prompt: {
        type: 'weekly_review',
        week_start: startDateStr,
        week_end: endDateStr,
      },
      response: review,
    })

    return NextResponse.json({
      ...review,
      week_start: startDateStr,
      week_end: endDateStr,
    })
  } catch (error) {
    console.error('Error generating weekly review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

