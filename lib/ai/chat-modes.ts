/**
 * Smart Mode Detection for Chat with Einstein
 * Detects user intent and switches chat modes accordingly
 */

export type ChatMode = 'learning' | 'task' | 'chat' | 'mixed'

export interface ModeDetectionResult {
  mode: ChatMode
  confidence: number
  keywords: string[]
  context: string
}

const learningTriggers = [
  'explain', 'teach', 'help me study', 'break this down', 'what does',
  'how does', 'can you explain', 'i don\'t understand', 'show me',
  'lesson', 'quiz', 'practice', 'study', 'learn', 'understand',
  'module', 'certification', 'exam', 'test', 'review',
]

const taskTriggers = [
  'write', 'generate', 'plan', 'create', 'make', 'build',
  'schedule', 'organize', 'add', 'new', 'task', 'todo',
  'deadline', 'remind', 'set up',
]

const chatTriggers = [
  'hey', 'hi', 'hello', 'what do you think', 'tell me',
  'talk about', 'discuss', 'opinion', 'what\'s up', 'how are you',
  'fun fact', 'something cool', 'interesting',
]

export function detectChatMode(userMessage: string): ModeDetectionResult {
  const lowerMessage = userMessage.toLowerCase()
  const words = lowerMessage.split(/\s+/)

  // Count matches for each mode
  let learningScore = 0
  let taskScore = 0
  let chatScore = 0

  const matchedKeywords: string[] = []

  // Check learning triggers
  learningTriggers.forEach((trigger) => {
    if (lowerMessage.includes(trigger)) {
      learningScore += trigger.split(' ').length
      matchedKeywords.push(trigger)
    }
  })

  // Check task triggers
  taskTriggers.forEach((trigger) => {
    if (lowerMessage.includes(trigger)) {
      taskScore += trigger.split(' ').length
      matchedKeywords.push(trigger)
    }
  })

  // Check chat triggers
  chatTriggers.forEach((trigger) => {
    if (lowerMessage.includes(trigger)) {
      chatScore += trigger.split(' ').length
      matchedKeywords.push(trigger)
    }
  })

  // Determine mode
  let mode: ChatMode = 'chat' // Default
  let confidence = 0.5

  if (learningScore > taskScore && learningScore > chatScore) {
    mode = 'learning'
    confidence = Math.min(learningScore / 5, 0.95)
  } else if (taskScore > learningScore && taskScore > chatScore) {
    mode = 'task'
    confidence = Math.min(taskScore / 5, 0.95)
  } else if (chatScore > 0) {
    mode = 'chat'
    confidence = Math.min(chatScore / 3, 0.95)
  }

  // Mixed mode if multiple modes detected
  const modesDetected = [
    learningScore > 0,
    taskScore > 0,
    chatScore > 0,
  ].filter(Boolean).length

  if (modesDetected > 1) {
    mode = 'mixed'
    confidence = 0.7
  }

  // Context detection
  let context = ''
  if (lowerMessage.includes('module') || lowerMessage.includes('certification')) {
    context = 'certification'
  } else if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
    context = 'task_management'
  } else if (lowerMessage.includes('project') || lowerMessage.includes('goal')) {
    context = 'project'
  } else if (lowerMessage.includes('habit')) {
    context = 'habit'
  }

  return {
    mode,
    confidence: Math.round(confidence * 100) / 100,
    keywords: matchedKeywords,
    context,
  }
}

export function getModePrompt(mode: ChatMode, context?: string): string {
  const basePersonality = `You are Einstein, a friendly AI assistant and learning mentor in the Little Einstein app. You're helpful, encouraging, and make learning fun.`

  const modePrompts = {
    learning: `You are in LEARNING MODE. Act as a patient teacher and mentor. 
- Provide clear, structured explanations
- Break complex topics into digestible parts
- Use examples and analogies
- Create quizzes or practice questions when helpful
- Relate concepts to the user's certifications or modules when relevant
- Be encouraging and supportive
- If asked about a specific module, reference it by name`,

    task: `You are in TASK MODE. Act as a productivity assistant.
- Help create tasks and schedules
- Break down goals into actionable steps
- Suggest time estimates
- Help organize and prioritize
- Generate task templates
- Be practical and action-oriented`,

    chat: `You are in CHAT MODE. Be conversational and engaging.
- Have friendly, natural conversations
- Share interesting facts or insights
- Be supportive and motivational
- Keep it light and engaging
- Feel free to be a bit playful
- Remember you're Einstein - be smart but approachable`,

    mixed: `You are in MIXED MODE. Balance multiple needs.
- Address both learning and task aspects
- Be flexible and adaptable
- Provide comprehensive help
- Switch between modes seamlessly as needed`,
  }

  let prompt = `${basePersonality}\n\n${modePrompts[mode]}`

  if (context) {
    prompt += `\n\nContext: The user is asking about ${context}. Use relevant information from their app.`
  }

  return prompt
}

