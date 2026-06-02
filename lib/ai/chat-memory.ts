/**
 * Chat memory: a small layer that lets Arcana remember the user across
 * conversations. Backed by the `chat_memory` table (see migration 005).
 *
 * Two responsibilities:
 *   1. fetchMemories  → pull stable facts about the user for the system prompt
 *   2. extractAndPersistMemories → heuristically pull new facts from the
 *      latest user message and upsert them.
 *
 * The extractor is regex-based on purpose. Calling OpenAI a second time per
 * message just to mine memories would double our spend and add latency. A
 * handful of high-signal patterns covers the cases that matter (preferences,
 * goals, study topics, identity) and the (user_id, memory_type, memory_key)
 * unique constraint dedupes naturally on upsert.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export type MemoryType = 'preference' | 'goal' | 'topic' | 'identity'

export interface MemoryRecord {
  memory_type: MemoryType
  memory_key: string
  memory_value: { text: string; source?: string }
  confidence: number
}

const MAX_MEMORIES_IN_PROMPT = 12
const MIN_CONFIDENCE_FOR_PROMPT = 0.4

/**
 * Pull the most-confident memories for a user. Empty array on any error —
 * memory is a "nice to have" and should never break the chat flow.
 */
export async function fetchMemories(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<MemoryRecord[]> {
  try {
    const { data, error } = await supabase
      .from('chat_memory')
      .select('memory_type, memory_key, memory_value, confidence')
      .eq('user_id', userId)
      .gte('confidence', MIN_CONFIDENCE_FOR_PROMPT)
      .order('confidence', { ascending: false })
      .limit(MAX_MEMORIES_IN_PROMPT)

    if (error || !data) return []
    return data as MemoryRecord[]
  } catch (e) {
    console.error('fetchMemories error:', e)
    return []
  }
}

/**
 * Turn a memory list into a compact block that slots into the system prompt.
 * Returns an empty string when there's nothing worth saying — keeps prompts
 * tidy for brand-new users.
 */
export function formatMemoriesForPrompt(memories: MemoryRecord[]): string {
  if (memories.length === 0) return ''

  // Group by type so the prompt reads naturally (and the model can weight
  // identity > preference > goal > topic as needed).
  const byType: Record<MemoryType, string[]> = {
    identity: [],
    preference: [],
    goal: [],
    topic: [],
  }
  memories.forEach((m) => {
    const text = m.memory_value?.text
    if (text && byType[m.memory_type]) {
      byType[m.memory_type].push(text)
    }
  })

  const sections: string[] = []
  if (byType.identity.length) sections.push(`About them: ${byType.identity.join('; ')}`)
  if (byType.preference.length) sections.push(`Preferences: ${byType.preference.join('; ')}`)
  if (byType.goal.length) sections.push(`Goals: ${byType.goal.join('; ')}`)
  if (byType.topic.length) sections.push(`Currently learning: ${byType.topic.join('; ')}`)

  return `\n\nWhat you remember about this user:\n- ${sections.join('\n- ')}`
}

interface ExtractionRule {
  type: MemoryType
  // Pattern must have a single capture group containing the salient noun phrase.
  pattern: RegExp
  // How we describe the memory in first-person-about-the-user terms.
  toText: (match: string) => string
  // Stable slug used as memory_key so repeated statements upsert in place.
  toKey: (match: string) => string
  confidence: number
}

const TRAILING_PUNCT_RE = /[.!?,;:]+$/
const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(TRAILING_PUNCT_RE, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

const trim = (s: string) => s.trim().replace(TRAILING_PUNCT_RE, '').slice(0, 200)

// Order matters: more specific patterns first so they win over loose ones.
const RULES: ExtractionRule[] = [
  {
    type: 'identity',
    pattern: /\b(?:my name is|i am|i'm)\s+([A-Z][a-zA-Z]{1,30})\b/,
    toText: (m) => `Name: ${trim(m)}`,
    toKey: (m) => `name-${slug(m)}`,
    confidence: 0.85,
  },
  {
    type: 'identity',
    pattern: /\bcall me\s+([A-Za-z][a-zA-Z]{1,30})\b/i,
    toText: (m) => `Preferred name: ${trim(m)}`,
    toKey: (m) => `name-${slug(m)}`,
    confidence: 0.9,
  },
  {
    type: 'identity',
    pattern: /\bi(?:'m| am)\s+a\s+([a-z][\w\s-]{2,50})/i,
    toText: (m) => `Role: ${trim(m)}`,
    toKey: (m) => `role-${slug(m)}`,
    confidence: 0.7,
  },
  {
    type: 'goal',
    pattern: /\bmy goal is (?:to\s+)?([\w][\w\s-]{2,80})/i,
    toText: (m) => `Wants to ${trim(m)}`,
    toKey: (m) => `goal-${slug(m)}`,
    confidence: 0.8,
  },
  {
    type: 'goal',
    pattern: /\bi (?:want|plan|hope|intend|need) to\s+([\w][\w\s-]{2,80})/i,
    toText: (m) => `Wants to ${trim(m)}`,
    toKey: (m) => `goal-${slug(m)}`,
    confidence: 0.65,
  },
  {
    type: 'topic',
    pattern: /\bi(?:'m| am) (?:learning|studying|reading about)\s+([\w][\w\s-]{2,60})/i,
    toText: (m) => `Currently studying ${trim(m)}`,
    toKey: (m) => `topic-${slug(m)}`,
    confidence: 0.75,
  },
  {
    type: 'topic',
    pattern: /\bi (?:want|am trying) to learn\s+([\w][\w\s-]{2,60})/i,
    toText: (m) => `Wants to learn ${trim(m)}`,
    toKey: (m) => `topic-${slug(m)}`,
    confidence: 0.7,
  },
  {
    type: 'preference',
    pattern: /\bi (?:prefer|like|love|enjoy)\s+([\w][\w\s-]{2,60})/i,
    toText: (m) => `Likes ${trim(m)}`,
    toKey: (m) => `pref-likes-${slug(m)}`,
    confidence: 0.6,
  },
  {
    type: 'preference',
    pattern: /\bi (?:hate|dislike|avoid|don'?t like)\s+([\w][\w\s-]{2,60})/i,
    toText: (m) => `Dislikes ${trim(m)}`,
    toKey: (m) => `pref-dislikes-${slug(m)}`,
    confidence: 0.6,
  },
  {
    type: 'preference',
    pattern: /\bi work (?:as|at)\s+([\w][\w\s-]{2,60})/i,
    toText: (m) => `Works as/at ${trim(m)}`,
    toKey: (m) => `work-${slug(m)}`,
    confidence: 0.7,
  },
]

/**
 * Run regex extraction over a user message and return any new memories.
 * Pure function so it's trivial to unit test if we ever care to.
 */
export function extractMemories(userMessage: string): MemoryRecord[] {
  if (!userMessage || userMessage.length < 5) return []

  const found = new Map<string, MemoryRecord>()
  for (const rule of RULES) {
    const match = userMessage.match(rule.pattern)
    if (!match || !match[1]) continue

    const captured = match[1]
    const key = rule.toKey(captured)
    if (!key) continue

    // Use a global namespace key so different rules can't clobber each other.
    const globalKey = `${rule.type}:${key}`
    if (found.has(globalKey)) continue

    found.set(globalKey, {
      memory_type: rule.type,
      memory_key: key,
      memory_value: {
        text: rule.toText(captured),
        source: userMessage.slice(0, 160),
      },
      confidence: rule.confidence,
    })
  }
  return Array.from(found.values())
}

/**
 * Extract and persist in one go. Best-effort: never throws — chat shouldn't
 * fail because we couldn't remember something.
 */
export async function extractAndPersistMemories(
  supabase: SupabaseClient<Database>,
  userId: string,
  userMessage: string
): Promise<MemoryRecord[]> {
  const memories = extractMemories(userMessage)
  if (memories.length === 0) return []

  try {
    const rows = memories.map((m) => ({
      user_id: userId,
      memory_type: m.memory_type,
      memory_key: m.memory_key,
      memory_value: m.memory_value,
      confidence: m.confidence,
      last_updated: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('chat_memory')
      .upsert(rows, { onConflict: 'user_id,memory_type,memory_key' })

    if (error) {
      console.error('chat_memory upsert error:', error.message)
    }
  } catch (e) {
    console.error('extractAndPersistMemories error:', e)
  }

  return memories
}
