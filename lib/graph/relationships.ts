import { createClient } from '@/lib/supabase/server'
import { Task } from '@/lib/types'

export interface TaskRelations {
  task_id: string
  project?: {
    id: string
    name: string
    progress: number
  }
  goal?: {
    id: string
    title: string
    progress: number
  }
  certification?: {
    id: string
    name: string
    module_name?: string
  }
  related_tasks?: Array<{
    task_id: string
    title: string
    relationship_type: 'dependency' | 'similar' | 'blocks' | 'related'
    strength: number
  }>
  time_patterns?: {
    optimal_hours: number[]
    avg_duration: number
    completion_rate: number
  }
  productivity_score?: number
  completion_likelihood?: number
}

export async function getTaskRelations(
  userId: string,
  taskId: string
): Promise<TaskRelations> {
  const supabase = createClient()

  // Get task
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task) {
    throw new Error('Task not found')
  }

  const relations: TaskRelations = {
    task_id: taskId,
  }

  // Get project relationship
  if (task.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, progress')
      .eq('id', task.project_id)
      .single()

    if (project) {
      relations.project = {
        id: project.id,
        name: project.name,
        progress: project.progress,
      }
    }
  }

  // Get goal relationship (through project or direct)
  if (task.project_id) {
    // Check if project has a goal
    // This would need a project_goals table or similar
  }

  // Get certification relationship
  if (task.cert_id) {
    const { data: cert } = await supabase
      .from('certifications')
      .select('id, name')
      .eq('id', task.cert_id)
      .single()

    let moduleName: string | undefined
    if (task.module_id) {
      const { data: module } = await supabase
        .from('cert_modules')
        .select('title')
        .eq('id', task.module_id)
        .single()

      moduleName = module?.title
    }

    if (cert) {
      relations.certification = {
        id: cert.id,
        name: cert.name,
        module_name: moduleName,
      }
    }
  }

  // Find related tasks (same project, category, or similar patterns)
  const { data: relatedTasks } = await supabase
    .from('tasks')
    .select('id, title, category, project_id')
    .eq('user_id', userId)
    .neq('id', taskId)
    .eq('done', false)

  const related: Array<{
    task_id: string
    title: string
    relationship_type: 'dependency' | 'similar' | 'blocks' | 'related'
    strength: number
  }> = []

  relatedTasks?.forEach((relatedTask) => {
    let relationshipType: 'dependency' | 'similar' | 'blocks' | 'related' = 'related'
    let strength = 0.3

    // Same project
    if (task.project_id && relatedTask.project_id === task.project_id) {
      relationshipType = 'related'
      strength = 0.8
    }

    // Same category
    if (task.category && relatedTask.category === task.category) {
      relationshipType = 'similar'
      strength = Math.max(strength, 0.6)
    }

    // Similar duration
    if (task.duration_minutes && relatedTask.duration_minutes) {
      const durationDiff = Math.abs(task.duration_minutes - relatedTask.duration_minutes)
      if (durationDiff < 30) {
        relationshipType = 'similar'
        strength = Math.max(strength, 0.5)
      }
    }

    if (strength > 0.4) {
      related.push({
        task_id: relatedTask.id,
        title: relatedTask.title,
        relationship_type: relationshipType,
        strength,
      })
    }
  })

  relations.related_tasks = related.slice(0, 5) // Top 5 related tasks

  // Get time patterns for similar tasks
  const { data: timeSessions } = await supabase
    .from('time_sessions')
    .select('start_time, duration_minutes, tasks(category, done)')
    .eq('user_id', userId)
    .eq('task_id', taskId)

  if (timeSessions && timeSessions.length > 0) {
    const hours = timeSessions.map((s: any) => new Date(s.start_time).getHours())
    const durations = timeSessions.map((s: any) => s.duration_minutes || 0).filter((d: number) => d > 0)
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : task.duration_minutes || 60

    // Get completion rate
    const completed = timeSessions.filter((s: any) => s.tasks?.done).length
    const completionRate = timeSessions.length > 0 ? completed / timeSessions.length : 0

    relations.time_patterns = {
      optimal_hours: Array.from(new Set(hours)),
      avg_duration: Math.round(avgDuration),
      completion_rate: completionRate,
    }
  }

  // Get productivity patterns
  const { data: patterns } = await supabase
    .from('productivity_patterns')
    .select('*')
    .eq('user_id', userId)
    .eq('pattern_type', 'best_time')
    .single()

  if (patterns && relations.time_patterns) {
    const bestHours = patterns.pattern_data?.best_hours || []
    const optimalHours = bestHours.map((h: any) => h.hour)
    relations.time_patterns.optimal_hours = optimalHours
  }

  return relations
}

export async function getProjectTaskGraph(
  userId: string,
  projectId: string
): Promise<{
  project: any
  tasks: Task[]
  milestones: any[]
  progress: number
}> {
  const supabase = createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: true })

  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('order_idx', { ascending: true })

  return {
    project,
    tasks: tasks || [],
    milestones: milestones || [],
    progress: project?.progress || 0,
  }
}

