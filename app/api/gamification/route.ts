import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Cross-device sync for XP, level, completion counts, streak, and unlocked
// achievements. The shape mirrors GamificationStore on the client; the server
// just persists whatever the client sends.
//
// The store is the authoritative writer — the server stores last-write-wins.
// We don't try to reconcile concurrent updates from two devices because the
// data is per-user and almost always single-writer at a time.

/**
 * GET: fetch the current user's gamification snapshot. Returns `null` for the
 * snapshot if no row exists yet (first visit on first device).
 */
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_gamification')
      .select('xp, level, total_tasks_completed, total_habits_completed, streak, achievements, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ snapshot: data ?? null })
  } catch (error: any) {
    console.error('GET /gamification error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch gamification' },
      { status: 500 }
    )
  }
}

/**
 * POST: upsert the user's gamification snapshot. Accepts the full state shape;
 * unknown fields are ignored. Clamps integers so a buggy client can't write
 * negative values.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    // Pull only the fields we care about and coerce to safe values.
    const clampNonNegativeInt = (value: unknown, fallback = 0): number => {
      const n = Number(value)
      if (!Number.isFinite(n)) return fallback
      return Math.max(0, Math.floor(n))
    }

    const row = {
      user_id: user.id,
      xp: clampNonNegativeInt(body.xp),
      level: Math.max(1, clampNonNegativeInt(body.level, 1)),
      total_tasks_completed: clampNonNegativeInt(body.total_tasks_completed),
      total_habits_completed: clampNonNegativeInt(body.total_habits_completed),
      streak: clampNonNegativeInt(body.streak),
      // Achievements is opaque jsonb — the catalog lives client-side. We just
      // require it's an array-shaped value before saving.
      achievements: Array.isArray(body.achievements) ? body.achievements : [],
    }

    const { error } = await supabase
      .from('user_gamification')
      .upsert(row, { onConflict: 'user_id' })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('POST /gamification error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to save gamification' },
      { status: 500 }
    )
  }
}
