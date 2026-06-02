import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: string | null
  progress: number
  maxProgress: number
}

interface GamificationStore {
  xp: number
  level: number
  totalTasksCompleted: number
  totalHabitsCompleted: number
  streak: number
  achievements: Achievement[]
  // Bookkeeping for cross-device sync. `hydrated` flips true once we've tried
  // to pull from the server, so the UI can avoid flashing stale values mid-load.
  hydrated: boolean
  syncing: boolean
  hydrateFromServer: () => Promise<void>
  addXP: (amount: number) => void
  completeTask: () => void
  completeHabit: () => void
  checkAchievements: () => void
  reset: () => void
}

// Flat 1000 XP per level. Linear leveling so the math stays predictable for
// the user — no surprise grind walls. We can move to a curve later if we
// actually need to slow people down.
const XP_PER_LEVEL = 1000

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-task',
    name: 'Getting Started',
    description: 'Complete your first task',
    icon: '🎯',
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'ten-tasks',
    name: 'Task Master',
    description: 'Complete 10 tasks',
    icon: '⭐',
    unlockedAt: null,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'hundred-tasks',
    name: 'Centurion',
    description: 'Complete 100 tasks',
    icon: '🏆',
    unlockedAt: null,
    progress: 0,
    maxProgress: 100,
  },
  {
    id: 'seven-day-streak',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    unlockedAt: null,
    progress: 0,
    maxProgress: 7,
  },
  {
    id: 'thirty-day-streak',
    name: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '💪',
    unlockedAt: null,
    progress: 0,
    maxProgress: 30,
  },
  {
    id: 'perfect-day',
    name: 'Perfect Day',
    description: 'Complete all tasks in a day',
    icon: '✨',
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete a task before 8 AM',
    icon: '🌅',
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete a task after 10 PM',
    icon: '🦉',
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
  },
]

const initialState = {
  xp: 0,
  level: 1,
  totalTasksCompleted: 0,
  totalHabitsCompleted: 0,
  streak: 0,
  achievements: INITIAL_ACHIEVEMENTS,
  hydrated: false,
  syncing: false,
}

// Merge a server snapshot (which only stores progress/unlockedAt by id) with
// our local achievement catalog so we always know the human-readable name and
// icon even after the catalog grows.
function mergeAchievements(
  catalog: Achievement[],
  fromServer: unknown
): Achievement[] {
  if (!Array.isArray(fromServer)) return catalog
  const byId = new Map<string, Partial<Achievement>>()
  for (const entry of fromServer) {
    if (entry && typeof entry === 'object' && 'id' in entry) {
      byId.set(String((entry as any).id), entry as Partial<Achievement>)
    }
  }
  return catalog.map((a) => {
    const server = byId.get(a.id)
    if (!server) return a
    return {
      ...a,
      progress: typeof server.progress === 'number' ? server.progress : a.progress,
      unlockedAt: typeof server.unlockedAt === 'string' ? server.unlockedAt : a.unlockedAt,
    }
  })
}

// Strip down to the minimum bytes that meaningfully change per-update. The
// catalog metadata (name/description/icon) is client-defined, so we don't
// re-send it on every write.
function snapshotForServer(state: {
  xp: number
  level: number
  totalTasksCompleted: number
  totalHabitsCompleted: number
  streak: number
  achievements: Achievement[]
}) {
  return {
    xp: state.xp,
    level: state.level,
    total_tasks_completed: state.totalTasksCompleted,
    total_habits_completed: state.totalHabitsCompleted,
    streak: state.streak,
    achievements: state.achievements.map(({ id, progress, unlockedAt }) => ({
      id,
      progress,
      unlockedAt,
    })),
  }
}

// Debounced server push. We coalesce rapid-fire updates (e.g. completing
// several tasks quickly) into a single POST per ~600ms.
let pushTimer: ReturnType<typeof setTimeout> | null = null
let pendingPush = false

function schedulePush(getState: () => GamificationStore) {
  if (typeof window === 'undefined') return
  pendingPush = true
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(async () => {
    if (!pendingPush) return
    pendingPush = false
    const s = getState()
    if (!s.hydrated) return // wait until we know the starting point
    try {
      await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshotForServer(s)),
      })
    } catch {
      // Offline / 500 — local cache (Zustand persist) still has the value.
      // Next interaction will retry.
    }
  }, 600)
}

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      hydrateFromServer: async () => {
        if (typeof window === 'undefined') return
        if (get().syncing) return
        set({ syncing: true })
        try {
          const res = await fetch('/api/gamification', { cache: 'no-store' })
          if (!res.ok) {
            // 401 → user signed out; 500 → fall back to localStorage cache.
            set({ syncing: false, hydrated: true })
            return
          }
          const data = await res.json().catch(() => null)
          const snap = data?.snapshot
          if (!snap) {
            // No server row yet: push our local state up so the first device
            // becomes the seed.
            set({ syncing: false, hydrated: true })
            schedulePush(get)
            return
          }
          set({
            xp: Number(snap.xp) || 0,
            level: Math.max(1, Number(snap.level) || 1),
            totalTasksCompleted: Number(snap.total_tasks_completed) || 0,
            totalHabitsCompleted: Number(snap.total_habits_completed) || 0,
            streak: Number(snap.streak) || 0,
            achievements: mergeAchievements(INITIAL_ACHIEVEMENTS, snap.achievements),
            hydrated: true,
            syncing: false,
          })
        } catch {
          set({ syncing: false, hydrated: true })
        }
      },

      addXP: (amount) => {
        set((state) => {
          const newXP = state.xp + amount
          const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1
          return {
            xp: newXP,
            level: newLevel,
          }
        })
        schedulePush(get)
      },

      // Habits are worth slightly more than tasks (15 vs 10) because they
      // require consistency, not just a one-off action. Don't tell the user;
      // they should feel rewarded, not gamed.
      completeTask: () => {
        set((state) => ({
          totalTasksCompleted: state.totalTasksCompleted + 1,
        }))
        get().addXP(10)
        get().checkAchievements()
      },

      completeHabit: () => {
        set((state) => ({
          totalHabitsCompleted: state.totalHabitsCompleted + 1,
        }))
        get().addXP(15)
        get().checkAchievements()
      },

      checkAchievements: () => {
        const state = get()
        set((prev) => ({
          achievements: prev.achievements.map((achievement) => {
            if (achievement.unlockedAt) return achievement

            let progress = achievement.progress
            let unlocked = false

            switch (achievement.id) {
              case 'first-task':
                progress = state.totalTasksCompleted >= 1 ? 1 : 0
                unlocked = state.totalTasksCompleted >= 1
                break
              case 'ten-tasks':
                progress = Math.min(state.totalTasksCompleted, 10)
                unlocked = state.totalTasksCompleted >= 10
                break
              case 'hundred-tasks':
                progress = Math.min(state.totalTasksCompleted, 100)
                unlocked = state.totalTasksCompleted >= 100
                break
              case 'seven-day-streak':
                progress = Math.min(state.streak, 7)
                unlocked = state.streak >= 7
                break
              case 'thirty-day-streak':
                progress = Math.min(state.streak, 30)
                unlocked = state.streak >= 30
                break
            }

            return {
              ...achievement,
              progress,
              unlockedAt: unlocked ? new Date().toISOString() : null,
            }
          }),
        }))
        schedulePush(get)
      },

      reset: () => {
        set(initialState)
        schedulePush(get)
      },
    }),
    {
      name: 'arcana-gamification',
      partialize: (state) => ({
        // We deliberately omit `hydrated` and `syncing` from the persisted
        // cache so a fresh tab always re-runs the server sync flow.
        xp: state.xp,
        level: state.level,
        totalTasksCompleted: state.totalTasksCompleted,
        totalHabitsCompleted: state.totalHabitsCompleted,
        streak: state.streak,
        achievements: state.achievements,
      }),
    }
  )
)
