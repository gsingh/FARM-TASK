import { useEffect, useState, useCallback } from "react"
import { useWateringStore } from "@/stores/watering-store"
import { useZoneStore } from "@/stores/zone-store"
import { WateringTimeline } from "@/components/watering/watering-timeline"
import { WaterLogDialog } from "@/components/watering/water-log-dialog"
import { Button } from "@/components/ui/button"
import type { WateringLogCreatePayload } from "@/types/watering"

export default function WateringPage() {
  const { logs, isLoading, error, fetchAllHistory, logWatering } = useWateringStore()
  const { zones, fetchZones } = useZoneStore()
  const [showLogDialog, setShowLogDialog] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadAll = useCallback(() => {
    if (zones.length > 0) {
      fetchAllHistory(zones.map((z) => z.id))
    }
  }, [zones, fetchAllHistory])

  useEffect(() => {
    if (zones.length === 0) {
      fetchZones()
    }
  }, [fetchZones, zones.length])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleLogAndRefresh = useCallback(async (zoneId: number, data: WateringLogCreatePayload) => {
    setActionError(null)
    try {
      await logWatering(zoneId, data)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to log watering")
      throw err
    }
  }, [logWatering])

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-farm-green-dark">Watering Log</h1>
          <p className="text-sm text-gray-500">
            {logs.length > 0 ? `${logs.length} watering${logs.length !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <Button onClick={() => setShowLogDialog(true)}>Log Watering</Button>
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</div>
      )}
      {error && !actionError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={loadAll} className="ml-2 underline">Retry</button>
        </div>
      )}

      <WateringTimeline logs={logs} zones={zones} isLoading={isLoading} />

      <WaterLogDialog
        open={showLogDialog}
        onOpenChange={setShowLogDialog}
        zones={zones}
        onSave={handleLogAndRefresh}
      />
    </div>
  )
}
