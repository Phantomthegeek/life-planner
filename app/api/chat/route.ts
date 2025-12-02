import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithEinstein, ChatMessage } from '@/lib/ai/chat'

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
    const { 
      message, 
      conversation_id, 
      context 
    } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get or create conversation
    let conversationId = conversation_id

    if (!conversationId) {
      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50), // First 50 chars as title
        })
        .select()
        .single()

      if (convError) {
        return NextResponse.json({ error: convError.message }, { status: 400 })
      }

      conversationId = conversation.id
    }

    // Get conversation history
    const { data: historyMessages, error: historyError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 400 })
    }

    // Convert to ChatMessage format
    const conversationHistory: ChatMessage[] = (historyMessages || []).map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      mode: msg.mode as any,
      timestamp: msg.created_at,
      metadata: msg.metadata || {},
    }))

    // Save user message
    const { error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        metadata: context || {},
      })

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError)
    }

    // Get AI response
    const response = await chatWithEinstein(
      user.id,
      message,
      conversationHistory,
      context
    )

    // Save assistant message
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: response.message,
        mode: response.mode,
        metadata: {
          suggestions: response.suggestions,
          inline_tools: response.inline_tools,
        },
      })
      .select()
      .single()

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError)
    }

    // Update conversation title if it's the first message
    if (conversationHistory.length === 0) {
      await supabase
        .from('chat_conversations')
        .update({
          title: message.substring(0, 50),
          mode: response.mode,
        })
        .eq('id', conversationId)
    } else {
      // Update mode if conversation evolves
      await supabase
        .from('chat_conversations')
        .update({ mode: response.mode })
        .eq('id', conversationId)
    }

    return NextResponse.json({
      message: response.message,
      mode: response.mode,
      suggestions: response.suggestions,
      inline_tools: response.inline_tools,
      should_save_to_notes: response.should_save_to_notes,
      conversation_id: conversationId,
      message_id: assistantMessage?.id,
    })
  } catch (error: any) {
    console.error('Error in chat route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const conversation_id = searchParams.get('conversation_id')

    if (conversation_id) {
      // Get messages for specific conversation
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ messages: messages || [] })
    } else {
      // Get all conversations
      const { data: conversations, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ conversations: conversations || [] })
    }
  } catch (error: any) {
    console.error('Error fetching chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

