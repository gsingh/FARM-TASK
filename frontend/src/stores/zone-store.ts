import { create } from "zustand"
import { apiClient } from "@/lib/api-client"
import { db } from "@/lib/db"
import { enqueueChange } from "@/lib/sync-queue"
import type { Zone, ZoneCreatePayload, ZoneUpdatePayload, ZoneListResponse, ZoneSingleResponse } from "@/types/zone"

interface ZoneState {
  zones: Zone[]
  total: number
  page: number
  isLoading: boolean
  error: string | null
  isOffline: boolean

  fetchZones: (page?: number) => Promise<void>
  createZone: (data: ZoneCreatePayload) => Promise<Zone>
  updateZone: (id: number, data: ZoneUpdatePayload) => Promise<Zone>
  deleteZone: (id: number) => Promise<void>
  clearError: () => void
}

export const useZoneStore = create<ZoneState>((set, get) => ({
  zones: [],
  total: 0,
  page: 1,
  isLoading: false,
  error: null,
  isOffline: false,

  fetchZones: async (page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get<ZoneListResponse>("/zones", { page, per_page: 20 })
      const serverZones = response.data
      await db.zones.bulkPut(serverZones)
      const offlineZones = (await db.zones.toArray()).filter((z) => z.id < 0)
      const merged = [...serverZones, ...offlineZones]
      set({ zones: merged, total: merged.length, page: 1, isLoading: false, isOffline: false })
    } catch {
      let cached: Zone[] = []
      try { cached = await db.zones.toArray() } catch { cached = [] }
      set({ zones: cached, total: cached.length, page: 1, isLoading: false, isOffline: true })
    }
  },

  createZone: async (data: ZoneCreatePayload) => {
    set({ error: null })
    try {
      const response = await apiClient.post<ZoneSingleResponse>("/zones", data)
      const newZone = response.data
      await db.zones.put(newZone)
      set((state) => ({
        zones: [...state.zones, newZone],
        total: state.total + 1,
      }))
      return newZone
    } catch (err) {
      if (!navigator.onLine) {
        const tempId = -(Date.now() + Math.random() * 1000)
        const offlineZone: Zone = {
          ...data,
          id: tempId,
          is_active: true,
          color: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await db.zones.put(offlineZone)
        await enqueueChange("zones", "create", data as unknown as Record<string, unknown>, tempId)
        set((state) => ({
          zones: [...state.zones, offlineZone],
          total: state.total + 1,
          isOffline: true,
        }))
        return offlineZone
      }
      const message = err instanceof Error ? err.message : "Failed to create zone"
      set({ error: message })
      throw err
    }
  },

  updateZone: async (id: number, data: ZoneUpdatePayload) => {
    set({ error: null })
    try {
      const response = await apiClient.put<ZoneSingleResponse>(`/zones/${id}`, data)
      const updated = response.data
      await db.zones.put(updated)
      set((state) => ({
        zones: state.zones.map((z) => (z.id === id ? updated : z)),
      }))
      return updated
    } catch (err) {
      if (!navigator.onLine) {
        const existing = get().zones.find((z) => z.id === id)
        if (existing) {
          const offlineUpdate = { ...existing, ...data, updated_at: new Date().toISOString() }
          await db.zones.put(offlineUpdate)
          await enqueueChange("zones", "update", data as unknown as Record<string, unknown>, id)
          set((state) => ({
            zones: state.zones.map((z) => (z.id === id ? offlineUpdate : z)),
            isOffline: true,
          }))
          return offlineUpdate
        }
      }
      const message = err instanceof Error ? err.message : "Failed to update zone"
      set({ error: message })
      throw err
    }
  },

  deleteZone: async (id: number) => {
    set({ error: null })
    try {
      await apiClient.delete(`/zones/${id}`)
      await db.zones.delete(id)
      set((state) => ({
        zones: state.zones.filter((z) => z.id !== id),
        total: Math.max(0, state.total - 1),
      }))
    } catch (err) {
      if (!navigator.onLine) {
        await db.zones.delete(id)
        await enqueueChange("zones", "delete", {}, id)
        set((state) => ({
          zones: state.zones.filter((z) => z.id !== id),
          total: Math.max(0, state.total - 1),
          isOffline: true,
        }))
        return
      }
      const message = err instanceof Error ? err.message : "Failed to delete zone"
      set({ error: message })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
