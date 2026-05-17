import { useState, useEffect, useCallback, useRef } from "react"
import { processSyncQueue, getPendingCount } from "@/lib/sync-queue"

export type SyncStatus = "idle" | "synced" | "pending" | "syncing" | "error"

interface UseSyncResult {
  syncStatus: SyncStatus
  pendingCount: number
  triggerSync: () => Promise<void>
}

export function useSync(): UseSyncResult {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [pendingCount, setPendingCount] = useState(0)
  const isSyncing = useRef(false)

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount()
    setPendingCount(count)
    setSyncStatus((prev) => (count > 0 && prev !== "syncing" ? "pending" : prev === "idle" && count === 0 ? "idle" : prev))
  }, [])

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing.current) return
    isSyncing.current = true
    setSyncStatus("syncing")
    try {
      const { synced, failed } = await processSyncQueue()
      if (synced > 0 || failed > 0) {
        setSyncStatus(failed > 0 && synced === 0 ? "error" : "synced")
      }
      await refreshPendingCount()
    } catch {
      setSyncStatus("error")
    } finally {
      isSyncing.current = false
    }
  }, [refreshPendingCount])

  useEffect(() => {
    refreshPendingCount()

    if (navigator.onLine) {
      triggerSync()
    }

    const handleOnline = () => {
      triggerSync()
    }

    const handleOffline = () => {
      refreshPendingCount()
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [refreshPendingCount, triggerSync])

  return { syncStatus, pendingCount, triggerSync }
}
