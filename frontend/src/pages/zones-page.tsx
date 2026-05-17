import { useEffect, useState, useCallback } from "react"
import { useZoneStore } from "@/stores/zone-store"
import { ZoneCard, ZoneCardSkeleton } from "@/components/zone/zone-card"
import { ZoneDetailSheet } from "@/components/zone/zone-detail-sheet"
import { ZoneFormDialog } from "@/components/zone/zone-form-dialog"
import { WaterLogDialog } from "@/components/watering/water-log-dialog"
import { Button } from "@/components/ui/button"
import type { Zone, ZoneCreatePayload, ZoneUpdatePayload } from "@/types/zone"
import type { WateringLogCreatePayload } from "@/types/watering"

export default function ZonesPage() {
  const { zones, total, isLoading, error, fetchZones, createZone, updateZone, deleteZone } = useZoneStore()
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showWaterDialog, setShowWaterDialog] = useState(false)
  const [waterZoneId, setWaterZoneId] = useState<number | undefined>()
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  const handleZoneTap = useCallback((zone: Zone) => {
    setSelectedZone(zone)
    setShowDetail(true)
  }, [])

  const handleCreate = useCallback(async (data: ZoneCreatePayload) => {
    setActionError(null)
    try {
      await createZone(data)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to create zone")
    }
  }, [createZone])

  const handleEdit = useCallback(async (id: number, data: ZoneUpdatePayload) => {
    setActionError(null)
    try {
      await updateZone(id, data)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update zone")
    }
  }, [updateZone])

  const handleDelete = useCallback(async (id: number) => {
    setActionError(null)
    try {
      await deleteZone(id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete zone")
      throw err
    }
  }, [deleteZone])

  const handleWaterZone = useCallback((zone: Zone) => {
    setWaterZoneId(zone.id)
    setShowWaterDialog(true)
  }, [])

  const handleWaterSave = useCallback(async (_zoneId: number, _data: WateringLogCreatePayload) => {
    setActionError(null)
    try {
      const response = await fetch(`/api/zones/${_zoneId}/water`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(_data),
      })
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body?.error?.message || "Failed to log watering")
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to log watering")
      throw err
    }
  }, [])

  if (isLoading && zones.length === 0) {
    return (
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-9 w-28 animate-pulse rounded bg-gray-200" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <ZoneCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-farm-green-dark">Zones</h1>
          <p className="text-sm text-gray-500">{total} zone{total !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>Add Zone</Button>
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {error && !actionError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => fetchZones()} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {zones.length === 0 && !isLoading && !error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl">🌱</span>
          <h2 className="mt-4 text-lg font-semibold text-gray-700">Start by adding your first farm zone</h2>
          <p className="mt-1 text-sm text-gray-500">Create zones to organize your farm and track tasks.</p>
          <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
            Add Zone
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} onTap={handleZoneTap} onWater={handleWaterZone} />
          ))}
        </div>
      )}

      {isLoading && zones.length > 0 && (
        <div className="space-y-3">
          {Array.from({ length: 1 }).map((_, i) => (
            <ZoneCardSkeleton key={`loading-${i}`} />
          ))}
        </div>
      )}

      <ZoneFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSave={handleCreate}
      />

      <ZoneDetailSheet
        zone={selectedZone}
        open={showDetail}
        onOpenChange={setShowDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <WaterLogDialog
        open={showWaterDialog}
        onOpenChange={setShowWaterDialog}
        zones={zones}
        preselectedZoneId={waterZoneId}
        onSave={handleWaterSave}
      />
    </div>
  )
}
