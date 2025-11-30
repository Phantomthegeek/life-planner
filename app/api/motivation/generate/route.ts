import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMotivation } from '@/lib/motivation/engine'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const context = searchParams.get('context') as 'morning' | 'midday' | 'evening' | 'contextual' || 'contextual'

    const motivation = await generateMotivation(user.id, context)
    return NextResponse.json(motivation)
  } catch (error: any) {
    console.error('Error generating motivation:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

