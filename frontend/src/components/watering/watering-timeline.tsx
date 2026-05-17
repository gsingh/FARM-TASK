import type { WateringLog } from "@/types/watering"
import type { Zone } from "@/types/zone"
import { Skeleton } from "@/components/ui/skeleton"

interface WateringTimelineProps {
  logs: WateringLog[]
  zones: Zone[]
  isLoading: boolean
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)

  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"

  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

export function WateringTimeline({ logs, zones, isLoading }: WateringTimelineProps) {
  const zoneMap = Object.fromEntries(zones.map((z) => [z.id, z.name]))

  const groups: Record<string, WateringLog[]> = {}
  logs.forEach((log) => {
    const dateKey = log.logged_at.slice(0, 10)
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(log)
  })

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  if (!isLoading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl">💧</span>
        <h2 className="mt-4 text-lg font-semibold text-gray-700">Log your first watering</h2>
        <p className="mt-1 text-sm text-gray-500">Tap a zone to start</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="ml-2 space-y-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Skeleton key={j} className="h-14 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        sortedDates.map((dateKey) => (
          <div key={dateKey}>
            <h3 className="mb-2 text-sm font-semibold text-gray-500">
              {formatDateLabel(groups[dateKey][0].logged_at)}
            </h3>
            <div className="ml-2 space-y-2">
              {groups[dateKey].map((log) => (
                <div key={log.id} className="rounded-lg border bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-farm-green-dark">
                        {zoneMap[log.zone_id] ?? `Zone #${log.zone_id}`}
                      </span>
                      <span className="text-xs text-gray-400">{formatTime(log.logged_at)}</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      {log.water_amount}L
                    </span>
                  </div>
                  {log.notes && (
                    <p className="mt-1 text-xs text-gray-500">{log.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
