import { useGamificationStore } from '@/stores/use-gamification-store'

// Thin wrappers so feature code never has to know that gamification is
// a zustand store. If we ever swap this for a server-side XP system, only
// this file needs to change.

export function rewardTaskCompletion() {
  useGamificationStore.getState().completeTask()
}

export function rewardHabitCompletion() {
  useGamificationStore.getState().completeHabit()
}
