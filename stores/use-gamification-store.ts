import { create } from 'zustand'

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
  addXP: (amount: number) => void
  completeTask: () => void
  completeHabit: () => void
  checkAchievements: () => void
  reset: () => void
}

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

export const useGamificationStore = create<GamificationStore>((set, get) => ({
  xp: 0,
  level: 1,
  totalTasksCompleted: 0,
  totalHabitsCompleted: 0,
  streak: 0,
  achievements: INITIAL_ACHIEVEMENTS,

  addXP: (amount) =>
    set((state) => {
      const newXP = state.xp + amount
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1
      return {
        xp: newXP,
        level: newLevel,
      }
    }),

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
  },

  reset: () =>
    set({
      xp: 0,
      level: 1,
      totalTasksCompleted: 0,
      totalHabitsCompleted: 0,
      streak: 0,
      achievements: INITIAL_ACHIEVEMENTS,
    }),
}))

