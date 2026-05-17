import { useEffect, useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useDashboardStore } from "@/stores/dashboard-store"
import { useZoneStore } from "@/stores/zone-store"
import { ZoneCard, ZoneCardSkeleton } from "@/components/zone/zone-card"
import { ZoneDetailSheet } from "@/components/zone/zone-detail-sheet"
import { DashboardSummaryDisplay, DashboardSummarySkeleton } from "@/components/shared/dashboard-summary"
import { Button } from "@/components/ui/button"
import { WaterLogDialog } from "@/components/watering/water-log-dialog"
import { apiClient } from "@/lib/api-client"
import type { Zone, ZoneUpdatePayload } from "@/types/zone"
import type { WateringLogCreatePayload } from "@/types/watering"

export default function TodayPage() {
  const navigate = useNavigate()
  const { summary, todayTasks, isLoading, error, fetchDashboard, clearError } = useDashboardStore()
  const { zones, isLoading: zonesLoading, fetchZones, updateZone, deleteZone } = useZoneStore()

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showWaterDialog, setShowWaterDialog] = useState(false)
  const [waterZoneId, setWaterZoneId] = useState<number | undefined>()
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
    if (zones.length === 0) fetchZones()
  }, [fetchDashboard, fetchZones])

  const zoneNextTaskMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const group of todayTasks) {
      if (group.tasks.length > 0) {
        map.set(group.zone_id, group.tasks[0].title)
      }
    }
    return map
  }, [todayTasks])

  const loading = isLoading || zonesLoading

  const handleZoneTap = useCallback((zone: Zone) => {
    setSelectedZone(zone)
    setShowDetail(true)
  }, [])

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
    }
  }, [deleteZone])

  const handleWaterZone = useCallback((zone: Zone) => {
    setWaterZoneId(zone.id)
    setShowWaterDialog(true)
  }, [])

  const handleWaterSave = useCallback(async (zoneId: number, data: WateringLogCreatePayload) => {
    setActionError(null)
    try {
      await apiClient.post(`/zones/${zoneId}/water`, data)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to log watering")
    }
  }, [])

  if (loading && zones.length === 0) {
    return (
      <div className="space-y-4 p-4" aria-busy={true}>
        <DashboardSummarySkeleton />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ZoneCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!loading && zones.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <span className="text-4xl">🌱</span>
        <h2 className="mt-4 text-lg font-semibold text-gray-700">Start by adding your first farm zone</h2>
        <p className="mt-1 text-sm text-gray-500">Create zones to organize your farm and track tasks.</p>
        <Button className="mt-4" onClick={() => navigate("/zones")}>Add Zone</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-xl font-bold text-farm-green-dark">Today</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => fetchDashboard()} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {actionError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {summary && !loading && <DashboardSummaryDisplay summary={summary} totalZones={zones.length} />}

      {loading && (!summary || zones.length === 0) && <DashboardSummarySkeleton />}

      {zones.length > 0 && (
        <div className="space-y-3" aria-busy={loading}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Zones</h2>
          {[...zones.filter((z) => z.is_active), ...zones.filter((z) => !z.is_active)].map((zone) => (
            <div key={zone.id}>
              <ZoneCard
                zone={zone}
                onTap={handleZoneTap}
                onWater={handleWaterZone}
              />
              {zoneNextTaskMap.has(zone.id) && (
                <p className="mt-1 text-xs text-gray-500 pl-1">Next: {zoneNextTaskMap.get(zone.id)}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && zones.length > 0 && (
        <div className="space-y-3" aria-busy={true}>
          {Array.from({ length: 1 }).map((_, i) => (
            <ZoneCardSkeleton key={`loading-${i}`} />
          ))}
        </div>
      )}

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
