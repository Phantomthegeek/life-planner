import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  hydrated: boolean
  syncing: boolean
  hydrateFromServer: () => Promise<void>
  addTemplate: (template: Omit<TaskTemplate, 'id'>) => Promise<void>
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  duplicateTemplate: (id: string) => Promise<void>
}

// Default templates seeded into a brand-new account. These are now created
// server-side on first hydration when the server has no rows, so other devices
// see the same starter set.
const DEFAULT_TEMPLATES: Omit<TaskTemplate, 'id'>[] = [
  {
    name: 'Morning Routine',
    title: 'Morning Routine',
    detail: 'Exercise, meditation, breakfast',
    duration_minutes: 60,
    category: 'personal',
  },
  {
    name: 'Study Session',
    title: 'Study Session',
    detail: 'Focused study time',
    duration_minutes: 90,
    category: 'study',
  },
  {
    name: 'Break Time',
    title: 'Break',
    detail: 'Rest and recharge',
    duration_minutes: 15,
    category: 'break',
  },
]

const migrationKey = 'arcana-templates-migrated'

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      // Empty by default — DEFAULT_TEMPLATES gets inserted via the server on
      // first hydration so they have real DB-issued ids and sync across
      // devices. localStorage cache fills in immediately after.
      templates: [],
      hydrated: false,
      syncing: false,

      hydrateFromServer: async () => {
        if (typeof window === 'undefined') return
        if (get().syncing) return
        set({ syncing: true })
        try {
          const res = await fetch('/api/templates', { cache: 'no-store' })
          if (!res.ok) {
            set({ syncing: false, hydrated: true })
            return
          }
          const data: TaskTemplate[] = await res.json().catch(() => [])

          // If the server is empty AND the cache has templates, push them up
          // (one-time migration from the old localStorage-only world).
          const cached = get().templates
          const alreadyMigrated = !!window.localStorage.getItem(migrationKey)

          if (data.length === 0 && cached.length > 0 && !alreadyMigrated) {
            try {
              const pushed = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  templates: cached.map(({ id: _id, ...rest }) => rest),
                }),
              })
              if (pushed.ok) {
                const payload = await pushed.json().catch(() => ({}))
                if (Array.isArray(payload.templates)) {
                  set({ templates: payload.templates })
                }
              }
              window.localStorage.setItem(migrationKey, '1')
            } catch {
              // Leave the cache in place; next hydration will retry.
            }
          } else if (data.length === 0 && !alreadyMigrated) {
            // Fresh account, no cache to migrate. Seed defaults.
            try {
              const pushed = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templates: DEFAULT_TEMPLATES }),
              })
              if (pushed.ok) {
                const payload = await pushed.json().catch(() => ({}))
                if (Array.isArray(payload.templates)) {
                  set({ templates: payload.templates })
                }
              }
              window.localStorage.setItem(migrationKey, '1')
            } catch {
              /* ignore — empty list is fine */
            }
          } else {
            set({ templates: data })
            window.localStorage.setItem(migrationKey, '1')
          }
        } catch {
          /* offline; keep cache */
        } finally {
          set({ syncing: false, hydrated: true })
        }
      },

      addTemplate: async (template) => {
        // Optimistic: assign a temp id and patch in real one after the round
        // trip. The list ordering is server-side `created_at`, so the temp
        // sits at the end and stays in place after the swap.
        const tempId = `temp-${Date.now()}`
        const optimistic: TaskTemplate = { ...template, id: tempId }
        set((state) => ({ templates: [...state.templates, optimistic] }))

        try {
          const res = await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template),
          })
          if (!res.ok) throw new Error(await res.text())
          const data = await res.json().catch(() => ({}))
          const created: TaskTemplate | undefined = data.templates?.[0]
          if (created) {
            set((state) => ({
              templates: state.templates.map((t) =>
                t.id === tempId ? created : t
              ),
            }))
          }
        } catch {
          // Roll back the optimistic insert on failure.
          set((state) => ({
            templates: state.templates.filter((t) => t.id !== tempId),
          }))
        }
      },

      updateTemplate: async (id, updates) => {
        const previous = get().templates
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }))
        try {
          const res = await fetch('/api/templates', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
          })
          if (!res.ok) throw new Error(await res.text())
        } catch {
          set({ templates: previous })
        }
      },

      deleteTemplate: async (id) => {
        const previous = get().templates
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }))
        try {
          const res = await fetch(`/api/templates?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
          })
          if (!res.ok) throw new Error(await res.text())
        } catch {
          set({ templates: previous })
        }
      },

      duplicateTemplate: async (id) => {
        const template = get().templates.find((t) => t.id === id)
        if (!template) return
        const { id: _id, ...rest } = template
        await get().addTemplate({ ...rest, name: `${template.name} (Copy)` })
      },
    }),
    {
      name: 'arcana-templates',
      partialize: (state) => ({
        // Don't persist hydration flags — every fresh tab should re-sync.
        templates: state.templates,
      }),
    }
  )
)
