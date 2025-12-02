import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { summarizeNote } from '@/lib/ai/notes-summarizer'

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
    const { note_id, content } = body

    if (!content && !note_id) {
      return NextResponse.json(
        { error: 'Content or note ID is required' },
        { status: 400 }
      )
    }

    let noteContent = content

    // If note_id provided, fetch the note
    if (note_id && !content) {
      const { data: note } = await supabase
        .from('notes')
        .select('*')
        .eq('id', note_id)
        .eq('user_id', user.id)
        .single()

      if (!note) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 })
      }

      noteContent = note.content
    }

    if (!noteContent) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      )
    }

    // Generate summary
    const summary = await summarizeNote(noteContent)

    // Save AI query
    await supabase.from('ai_queries').insert({
      user_id: user.id,
      prompt: {
        type: 'note_summary',
        note_id: note_id || null,
      },
      response: summary,
    })

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error summarizing note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

