import OpenAI from 'openai'
import { detectChatMode, getModePrompt, ChatMode } from './chat-modes'
import { buildContextBundle } from './context-builder'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  mode?: ChatMode
  timestamp: string
  metadata?: {
    module_id?: string
    task_id?: string
    saved_to_notes?: boolean
  }
}

export interface ChatResponse {
  message: string
  mode: ChatMode
  suggestions?: string[]
  inline_tools?: Array<{
    type: 'flashcard' | 'quiz' | 'diagram' | 'table'
    data: any
  }>
  should_save_to_notes?: boolean
}

if (!process.env.OPENAI_API_KEY) {
  console.error('⚠️ OPENAI_API_KEY is not set')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function chatWithEinstein(
  userId: string,
  message: string,
  conversationHistory: ChatMessage[] = [],
  context?: {
    module_id?: string
    cert_id?: string
    task_id?: string
    project_id?: string
  }
): Promise<ChatResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured')
  }

  // Detect chat mode
  const modeDetection = detectChatMode(message)

  // Build context bundle for user
  let userContext = ''
  try {
    const contextBundle = await buildContextBundle(userId)
    
    userContext = `
User Context:
- Active Projects: ${contextBundle.progress_context.active_projects.length}
- Active Goals: ${contextBundle.progress_context.active_goals.length}
- Certifications in Progress: ${contextBundle.progress_context.certification_progress.length}
- Today's Tasks: ${contextBundle.current_state.today_plan.length}
- Active Streaks: ${contextBundle.current_state.active_streaks}
- Best Hours: ${contextBundle.behavioral_insights.completion_patterns.best_hours.join(', ')}
- Current Mood: ${contextBundle.current_state.current_mood}
`
  } catch (error) {
    console.error('Error building context:', error)
  }

  // Get mode-specific prompt
  const systemPrompt = getModePrompt(modeDetection.mode, modeDetection.context) + userContext

  // Build conversation context
  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ]

  // Add conversation history (last 10 messages for context)
  const recentHistory = conversationHistory.slice(-10)
  recentHistory.forEach((msg) => {
    if (msg.role !== 'system') {
      messages.push({
        role: msg.role,
        content: msg.content,
      })
    }
  })

  // Add current message
  messages.push({ role: 'user', content: message })

  // Add context-specific information if provided
  if (context?.module_id) {
    // Fetch module details
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = createClient()
      const { data: module } = await supabase
        .from('cert_modules')
        .select('*, certifications(name)')
        .eq('id', context.module_id)
        .single()
      
      if (module) {
        messages[0].content += `\n\nThe user is asking about: ${module.title} (Module from ${module.certifications?.name || 'certification'}).`
        if (module.description) {
          messages[0].content += `\nModule Description: ${module.description}`
        }
        messages[0].content += `\nEstimated Hours: ${module.estimated_hours}h. Help them understand this module clearly.`
      }
    } catch (error) {
      console.error('Error fetching module:', error)
    }
  }

  if (context?.cert_id) {
    // Fetch certification details
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = createClient()
      const { data: cert } = await supabase
        .from('certifications')
        .select('name, description')
        .eq('id', context.cert_id)
        .single()
      
      if (cert) {
        messages[0].content += `\n\nThe user is asking about: ${cert.name}. ${cert.description || ''}. Provide helpful study advice.`
      }
    } catch (error) {
      console.error('Error fetching certification:', error)
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const responseText = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Could you try rephrasing your question?'

    // Generate suggestions based on mode
    const suggestions = generateSuggestions(modeDetection.mode, message)

    // Detect if inline tools are needed
    const inlineTools = detectInlineTools(responseText, modeDetection.mode)

    // Determine if should save to notes
    const shouldSaveToNotes = modeDetection.mode === 'learning' || 
                              message.toLowerCase().includes('save') ||
                              message.toLowerCase().includes('summary')

    return {
      message: responseText,
      mode: modeDetection.mode,
      suggestions,
      inline_tools: inlineTools.length > 0 ? inlineTools : undefined,
      should_save_to_notes: shouldSaveToNotes,
    }
  } catch (error: any) {
    console.error('Error in chat with Einstein:', error)
    
    if (error?.message?.includes('API key')) {
      throw new Error('OpenAI API key is invalid or missing.')
    }

    if (error?.status === 429 || error?.message?.includes('429')) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.')
    }

    throw new Error(`Failed to get response: ${error?.message || 'Unknown error'}`)
  }
}

function generateSuggestions(mode: ChatMode, message: string): string[] {
  const suggestions: string[] = []

  if (mode === 'learning') {
    suggestions.push('Create a quiz on this topic')
    suggestions.push('Break this down further')
    suggestions.push('Give me examples')
    suggestions.push('Save this to my notes')
  } else if (mode === 'task') {
    suggestions.push('Create a task for this')
    suggestions.push('Add to my schedule')
    suggestions.push('Break into smaller steps')
  } else {
    suggestions.push('Tell me more')
    suggestions.push('Give me an example')
    suggestions.push('Help me understand better')
  }

  return suggestions.slice(0, 3)
}

function detectInlineTools(responseText: string, mode: ChatMode): Array<{
  type: 'flashcard' | 'quiz' | 'diagram' | 'table'
  data: any
}> {
  const tools: Array<{ type: 'flashcard' | 'quiz' | 'diagram' | 'table'; data: any }> = []

  // If learning mode and response contains key concepts, suggest flashcards
  if (mode === 'learning') {
    // Detect definitions or key concepts
    if (responseText.includes('is') && responseText.includes('definition') || 
        responseText.includes('means') || 
        responseText.match(/\w+\s+is\s+\w+/)) {
      tools.push({
        type: 'flashcard',
        data: { message: responseText },
      })
    }
  }

  // If response suggests a comparison, suggest table
  if (responseText.includes('vs') || responseText.includes('compare') || responseText.includes('difference')) {
    tools.push({
      type: 'table',
      data: { message: responseText },
    })
  }

  return tools
}

