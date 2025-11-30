export interface AIScheduleItem {
  start: string
  end: string
  title: string
  category: string
  notes?: string
}

export interface AICoachResponse {
  summary: string
  schedule: AIScheduleItem[]
  actions: string[]
  estimates: {
    total_minutes: number
  }
  motivation: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  detail: string | null
  date: string
  start_ts: string | null
  end_ts: string | null
  duration_minutes: number | null
  actual_time_minutes?: number | null
  category: string | null
  cert_id: string | null
  module_id: string | null
  project_id?: string | null
  milestone_id?: string | null
  done: boolean
  recurring: any | null
  created_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  streak: number
  best_streak: number
  last_done: string | null
}

export interface Certification {
  id: string
  slug: string
  name: string
  description: string | null
  difficulty: number
  created_at: string
}

export interface CertModule {
  id: string
  cert_id: string
  title: string
  description: string | null
  estimated_hours: number
  order_idx: number
}

export interface UserCertProgress {
  id: string
  user_id: string
  cert_id: string
  progress: number
  target_date: string | null
  exam_scheduled: boolean
  exam_date: string | null
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  date: string
  content: string
  created_at: string
}

// ============================================
// NEW TYPES FOR ENHANCED FEATURES
// ============================================

export interface TimeSession {
  id: string
  user_id: string
  task_id: string | null
  project_id: string | null
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  notes: string | null
  created_at: string
}

export interface ActiveTimeSession {
  user_id: string
  session_id: string
  task_id: string | null
  started_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  target_date: string | null
  start_date: string | null
  status: 'active' | 'completed' | 'paused' | 'archived'
  progress: number
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string | null
  target_date: string | null
  start_date: string
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  progress: number
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  project_id: string | null
  goal_id: string | null
  name: string
  description: string | null
  target_date: string | null
  completed: boolean
  completed_at: string | null
  order_idx: number
  created_at: string
}

export interface ProductivityPattern {
  id: string
  user_id: string
  pattern_type: string
  pattern_data: Record<string, any>
  confidence_score: number
  last_updated: string
  created_at: string
}

export interface TaskCompletionHistory {
  id: string
  user_id: string
  task_id: string | null
  scheduled_start: string | null
  actual_start: string | null
  scheduled_end: string | null
  actual_end: string | null
  estimated_minutes: number | null
  actual_minutes: number | null
  completed_on_time: boolean | null
  rescheduled_count: number
  energy_level: number | null
  difficulty_rating: number | null
  completed_at: string | null
  created_at: string
}

export interface WeeklySummary {
  id: string
  user_id: string
  week_start: string
  week_end: string
  tasks_completed: number
  tasks_planned: number
  hours_tracked: number
  habits_maintained: number
  productivity_score: number | null
  insights: Record<string, any> | null
  created_at: string
}

export interface CalendarIntegration {
  id: string
  user_id: string
  provider: 'google' | 'outlook' | 'apple'
  access_token: string | null
  refresh_token: string | null
  calendar_id: string | null
  sync_enabled: boolean
  sync_direction: 'one-way-in' | 'one-way-out' | 'two-way'
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface ExternalCalendarEvent {
  id: string
  user_id: string
  integration_id: string | null
  external_id: string
  title: string
  start_time: string
  end_time: string
  description: string | null
  location: string | null
  imported_as_task: boolean
  task_id: string | null
  last_synced_at: string
  created_at: string
}

export interface AutomationRule {
  id: string
  user_id: string
  name: string
  trigger_type: string
  trigger_config: Record<string, any>
  action_type: string
  action_config: Record<string, any>
  enabled: boolean
  created_at: string
  updated_at: string
}

// ============================================
// CHAT TYPES
// ============================================

export interface ChatConversation {
  id: string
  user_id: string
  title: string | null
  mode: 'learning' | 'task' | 'chat' | 'mixed'
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  mode: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface ChatMemory {
  id: string
  user_id: string
  memory_type: string
  memory_key: string
  memory_value: Record<string, any>
  confidence: number
  last_updated: string
  created_at: string
}
