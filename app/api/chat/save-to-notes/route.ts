import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversation_id, title, summary } = body

    if (!conversation_id) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      )
    }

    // Get conversation messages
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 400 })
    }

    // Build note content
    let noteContent = `# ${title || 'Chat with Einstein'}\n\n`

    // Add summary if provided
    if (summary) {
      noteContent += `## Summary\n${summary}\n\n---\n\n`
    }

    // Add conversation
    noteContent += `## Conversation\n\n`
    
    messages?.forEach((msg) => {
      const role = msg.role === 'user' ? '**You**' : '**Einstein**'
      const timestamp = new Date(msg.created_at).toLocaleString()
      noteContent += `${role} (${timestamp}):\n${msg.content}\n\n---\n\n`
    })

    // Create note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        content: noteContent,
      })
      .select()
      .single()

    if (noteError) {
      return NextResponse.json({ error: noteError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      note_id: note.id,
      message: 'Chat saved to notes successfully',
    })
  } catch (error: any) {
    console.error('Error saving chat to notes:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

