import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, date } = body

    if (!id) {
      return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 })
    }

    const today = date || formatDate(new Date())
    const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000))

    // Fetch current habit
    const { data: habit, error: fetchError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    let newStreak = habit.streak || 0
    let bestStreak = habit.best_streak || 0

    // If last done was yesterday, increment streak
    if (habit.last_done === yesterday) {
      newStreak += 1
    } else if (habit.last_done !== today) {
      // If last done was not today or yesterday, reset streak
      newStreak = 1
    }

    // Update best streak if needed
    if (newStreak > bestStreak) {
      bestStreak = newStreak
    }

    // Update habit
    const { data, error } = await supabase
      .from('habits')
      .update({
        streak: newStreak,
        best_streak: bestStreak,
        last_done: today,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error completing habit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

