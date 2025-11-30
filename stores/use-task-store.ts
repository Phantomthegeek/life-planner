import { create } from 'zustand'
import { Task } from '@/lib/types'

interface TaskStore {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  getTasksByDate: (date: string) => Task[]
  isLoading: boolean
  setLoading: (loading: boolean) => void
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
  getTasksByDate: (date) => {
    const { tasks } = get()
    return tasks.filter((task) => task.date === date)
  },
  setLoading: (isLoading) => set({ isLoading }),
}))

