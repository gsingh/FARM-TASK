import { create } from "zustand"
import { apiClient } from "@/lib/api-client"
import { db } from "@/lib/db"
import { enqueueChange } from "@/lib/sync-queue"
import type { WateringLog, WateringLogCreatePayload, WateringLogListResponse, WateringLogSingleResponse } from "@/types/watering"

interface WateringState {
  logs: WateringLog[]
  isLoading: boolean
  error: string | null
  isOffline: boolean

  fetchAllHistory: (zoneIds: number[]) => Promise<void>
  logWatering: (zoneId: number, data: WateringLogCreatePayload) => Promise<WateringLog>
  clearError: () => void
}

export const useWateringStore = create<WateringState>((set) => ({
  logs: [],
  isLoading: false,
  error: null,
  isOffline: false,

  fetchAllHistory: async (zoneIds: number[]) => {
    set({ isLoading: true, error: null })
    try {
      const results = await Promise.all(
        zoneIds.map((id) =>
          apiClient.get<WateringLogListResponse>(`/zones/${id}/water`)
            .then((r) => r.data)
            .catch(() => [] as WateringLog[])
        )
      )
      const serverLogs = results.flat()
      await db.wateringLogs.bulkPut(serverLogs)
      const offlineLogs = (await db.wateringLogs.toArray()).filter((l) => l.id < 0)
      const allLogs = [...serverLogs, ...offlineLogs]
        .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
      set({ logs: allLogs, isLoading: false, isOffline: false })
    } catch {
      let cached: WateringLog[] = []
      try { cached = await db.wateringLogs.toArray() } catch { cached = [] }
      const sorted = cached.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
      set({ logs: sorted, isLoading: false, isOffline: true })
    }
  },

  logWatering: async (zoneId: number, data: WateringLogCreatePayload) => {
    set({ error: null })
    try {
      const response = await apiClient.post<WateringLogSingleResponse>(`/zones/${zoneId}/water`, data)
      const log = response.data
      await db.wateringLogs.put(log)
      set((state) => ({
        logs: [log, ...state.logs],
      }))
      return log
    } catch (err) {
      if (!navigator.onLine) {
        const tempId = -(Date.now() + Math.random() * 1000)
        const offlineLog: WateringLog = {
          id: tempId,
          zone_id: zoneId,
          water_amount: data.water_amount,
          notes: data.notes ?? null,
          logged_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }
        await db.wateringLogs.put(offlineLog)
        await enqueueChange("wateringLogs", "create", data as unknown as Record<string, unknown>, tempId, `zones/${zoneId}/water`)
        set((state) => ({
          logs: [offlineLog, ...state.logs],
          isOffline: true,
        }))
        return offlineLog
      }
      const message = err instanceof Error ? err.message : "Failed to log watering"
      set({ error: message })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
