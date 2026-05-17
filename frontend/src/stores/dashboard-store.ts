import { create } from "zustand"
import { apiClient } from "@/lib/api-client"
import type { DashboardSummary, ZoneTaskGroup, DashboardSummaryResponse, DashboardTodayResponse } from "@/types/dashboard"

interface DashboardState {
  summary: DashboardSummary | null
  todayTasks: ZoneTaskGroup[]
  isLoading: boolean
  error: string | null

  fetchDashboard: () => Promise<void>
  clearError: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  todayTasks: [],
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null })
    try {
      const [summaryRes, todayRes] = await Promise.all([
        apiClient.get<DashboardSummaryResponse>("/dashboard/summary"),
        apiClient.get<DashboardTodayResponse>("/dashboard/today"),
      ])
      set({
        summary: summaryRes.data,
        todayTasks: todayRes.data,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard"
      set({ error: message, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
