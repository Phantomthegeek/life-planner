// Lightweight keyword-based intent detection for the chat. It's intentionally
// dumb — a tiny scoring pass over hand-curated triggers — because the cost
// of being wrong is tiny (we just nudge the system prompt) and the cost of
// shipping a real classifier is not.

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

  // Longer triggers count more — "i don't understand" is a stronger signal
  // than just "learn", which appears in tons of unrelated sentences.
  const scoreTriggers = (triggers: string[]): { score: number; hits: string[] } => {
    const hits: string[] = []
    let score = 0
    for (const trigger of triggers) {
      if (lowerMessage.includes(trigger)) {
        score += trigger.split(' ').length
        hits.push(trigger)
      }
    }
    return { score, hits }
  }

  const learning = scoreTriggers(learningTriggers)
  const task = scoreTriggers(taskTriggers)
  const chat = scoreTriggers(chatTriggers)

  let mode: ChatMode = 'chat'
  let confidence = 0.5

  if (learning.score > task.score && learning.score > chat.score) {
    mode = 'learning'
    confidence = Math.min(learning.score / 5, 0.95)
  } else if (task.score > learning.score && task.score > chat.score) {
    mode = 'task'
    confidence = Math.min(task.score / 5, 0.95)
  } else if (chat.score > 0) {
    mode = 'chat'
    confidence = Math.min(chat.score / 3, 0.95)
  }

  // If more than one bucket lit up, flag it as mixed so the model knows to
  // tackle the most important part first instead of trying to do everything.
  const bucketsHit = [learning.score, task.score, chat.score].filter((s) => s > 0).length
  if (bucketsHit > 1) {
    mode = 'mixed'
    confidence = 0.7
  }

  // Best-effort context tag for the system prompt. Order matters: cert beats
  // generic "task" because certs always mention modules.
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
    keywords: [...learning.hits, ...task.hits, ...chat.hits],
    context,
  }
}

import { arcanaCore } from './personality'

export function getModePrompt(mode: ChatMode, context?: string): string {
  const modePrompts = {
    learning: `Right now you are TEACHING.
- Explain things clearly, building from what the user likely already knows.
- Use concrete examples and analogies before formal definitions.
- Offer to quiz the user at the end if the topic warrants it.
- If the question is about one of their certification modules, reference it by name.`,

    task: `Right now you are PLANNING.
- Translate goals into the smallest reasonable next action.
- Give realistic time estimates and call out anything that looks too ambitious.
- If something belongs on the calendar, suggest a specific date/time.
- Don't generate fluff or motivational quotes.`,

    chat: `Right now you are in conversation.
- Be warm and human. Short replies are fine.
- Ask one good follow-up question when it would actually help.
- You can be a little playful, but never sycophantic.`,

    mixed: `The user is mixing topics.
- Answer the most important part first, then offer to dig into the rest.
- Don't try to cover everything in one reply.`,
  }

  let prompt = `${arcanaCore()}\n\n${modePrompts[mode]}`

  if (context) {
    prompt += `\n\nContext from their app: ${context}.`
  }

  return prompt
}

