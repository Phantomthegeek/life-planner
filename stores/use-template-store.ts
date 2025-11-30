import { create } from 'zustand'

export interface TaskTemplate {
  id: string
  name: string
  title: string
  detail: string | null
  duration_minutes: number
  category: string
}

interface TemplateStore {
  templates: TaskTemplate[]
  addTemplate: (template: Omit<TaskTemplate, 'id'>) => void
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => void
  deleteTemplate: (id: string) => void
  duplicateTemplate: (id: string) => void
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [
    {
      id: '1',
      name: 'Morning Routine',
      title: 'Morning Routine',
      detail: 'Exercise, meditation, breakfast',
      duration_minutes: 60,
      category: 'personal',
    },
    {
      id: '2',
      name: 'Study Session',
      title: 'Study Session',
      detail: 'Focused study time',
      duration_minutes: 90,
      category: 'study',
    },
    {
      id: '3',
      name: 'Break Time',
      title: 'Break',
      detail: 'Rest and recharge',
      duration_minutes: 15,
      category: 'break',
    },
  ],
  addTemplate: (template) =>
    set((state) => ({
      templates: [
        ...state.templates,
        { ...template, id: Date.now().toString() },
      ],
    })),
  updateTemplate: (id, updates) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),
  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),
  duplicateTemplate: (id) => {
    const template = get().templates.find((t) => t.id === id)
    if (template) {
      get().addTemplate({
        ...template,
        name: `${template.name} (Copy)`,
      })
    }
  },
}))
