import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/shared/status-badge"
import type { Zone } from "@/types/zone"

const CROP_EMOJI: Record<string, string> = {
  corn: "🌽",
  wheat: "🌾",
  rice: "🌾",
  tomato: "🍅",
  lettuce: "🥬",
  carrot: "🥕",
  pepper: "🫑",
  grapes: "🍇",
  apple: "🍎",
  generic: "🌱",
}

function getCropEmoji(cropType: string): string {
  return CROP_EMOJI[cropType.toLowerCase()] ?? CROP_EMOJI.generic
}

function getStatusVariant(zone: Zone): "active" | "due" | "overdue" | "scheduled" {
  if (!zone.is_active) return "scheduled"
  const plantingDate = new Date(zone.planting_date)
  if (isNaN(plantingDate.getTime())) return "active"
  const dueDate = new Date(plantingDate)
  dueDate.setDate(dueDate.getDate() + zone.estimated_cycle_days)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  if (today > dueDate) return "overdue"
  const sevenDaysBefore = new Date(dueDate)
  sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7)
  if (today >= sevenDaysBefore) return "due"
  return "active"
}

interface ZoneCardProps {
  zone: Zone
  onTap?: (zone: Zone) => void
  onWater?: (zone: Zone) => void
}

export function ZoneCard({ zone, onTap, onWater }: ZoneCardProps) {
  const borderColor = zone.color ?? "#4CAF50"

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onTap?.(zone)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onTap?.(zone)
        }
      }}
      className={cn(
        "relative w-full rounded-lg border bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md",
        "min-h-[88px] cursor-pointer"
      )}
      style={{ borderLeft: `4px solid ${borderColor}` }}
      aria-label={`Zone ${zone.name}, status ${getStatusVariant(zone)}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-hidden="true">
            {getCropEmoji(zone.crop_type)}
          </span>
          <div>
            <h3 className="font-semibold text-farm-green-dark">{zone.name}</h3>
            <p className="text-sm text-gray-500">
              {zone.crop_type} · Planted {zone.planting_date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onWater && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onWater(zone)
              }}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-blue-500 transition-colors hover:bg-blue-50"
              aria-label={`Log water for ${zone.name}`}
            >
              💧
            </button>
          )}
          <StatusBadge variant={getStatusVariant(zone)} />
        </div>
      </div>
    </div>
  )
}

export function ZoneCardSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  )
}
