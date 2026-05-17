import { create } from "zustand"
import { apiClient } from "@/lib/api-client"
import { db } from "@/lib/db"
import { enqueueChange } from "@/lib/sync-queue"
import type { Task, TaskCreatePayload, TaskListResponse, TaskSingleResponse } from "@/types/task"

interface TaskState {
  tasks: Task[]
  total: number
  page: number
  isLoading: boolean
  error: string | null
  isOffline: boolean

  fetchTasks: (page?: number) => Promise<void>
  createTask: (data: TaskCreatePayload) => Promise<Task>
  completeTask: (id: number) => Promise<Task>
  deleteTask: (id: number) => Promise<void>
  clearError: () => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  total: 0,
  page: 1,
  isLoading: false,
  error: null,
  isOffline: false,

  fetchTasks: async (page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get<TaskListResponse>("/tasks", { page, per_page: 50 })
      const serverTasks = response.data
      await db.tasks.bulkPut(serverTasks)
      const offlineTasks = (await db.tasks.toArray()).filter((t) => t.id < 0)
      const merged = [...serverTasks, ...offlineTasks]
      set({ tasks: merged, total: merged.length, page: 1, isLoading: false, isOffline: false })
    } catch {
      let cached: Task[] = []
      try { cached = await db.tasks.toArray() } catch { cached = [] }
      set({ tasks: cached, total: cached.length, page: 1, isLoading: false, isOffline: true })
    }
  },

  createTask: async (data: TaskCreatePayload) => {
    set({ error: null })
    try {
      const response = await apiClient.post<TaskSingleResponse>("/tasks", data)
      const newTask = response.data
      await db.tasks.put(newTask)
      set((state) => ({
        tasks: [...state.tasks, newTask],
        total: state.total + 1,
      }))
      return newTask
    } catch (err) {
      if (!navigator.onLine) {
        const tempId = -(Date.now() + Math.random() * 1000)
        const offlineTask: Task = {
          ...data,
          id: tempId,
          status: "pending",
          assigned_to: data.assigned_to ?? null,
          due_date: data.due_date ?? null,
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await db.tasks.put(offlineTask)
        await enqueueChange("tasks", "create", data as unknown as Record<string, unknown>, tempId)
        set((state) => ({
          tasks: [...state.tasks, offlineTask],
          total: state.total + 1,
          isOffline: true,
        }))
        return offlineTask
      }
      const message = err instanceof Error ? err.message : "Failed to create task"
      set({ error: message })
      throw err
    }
  },

  completeTask: async (id: number) => {
    set({ error: null })
    try {
      const response = await apiClient.put<TaskSingleResponse>(`/tasks/${id}`, { status: "completed" })
      const updated = response.data
      await db.tasks.put(updated)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }))
      return updated
    } catch (err) {
      if (!navigator.onLine) {
        const existing = get().tasks.find((t) => t.id === id)
        if (existing) {
          const offlineUpdate: Task = { ...existing, status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          await db.tasks.put(offlineUpdate)
          await enqueueChange("tasks", "update", { status: "completed" }, id)
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? offlineUpdate : t)),
            isOffline: true,
          }))
          return offlineUpdate
        }
      }
      const message = err instanceof Error ? err.message : "Failed to complete task"
      set({ error: message })
      throw err
    }
  },

  deleteTask: async (id: number) => {
    set({ error: null })
    try {
      await apiClient.delete(`/tasks/${id}`)
      await db.tasks.delete(id)
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        total: Math.max(0, state.total - 1),
      }))
    } catch (err) {
      if (!navigator.onLine) {
        await db.tasks.delete(id)
        await enqueueChange("tasks", "delete", {}, id)
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          total: Math.max(0, state.total - 1),
          isOffline: true,
        }))
        return
      }
      const message = err instanceof Error ? err.message : "Failed to delete task"
      set({ error: message })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
