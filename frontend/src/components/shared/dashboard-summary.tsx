import { Skeleton } from "@/components/ui/skeleton"
import type { DashboardSummary } from "@/types/dashboard"

interface DashboardSummaryProps {
  summary: DashboardSummary
  totalZones?: number
}

export function DashboardSummaryDisplay({ summary, totalZones = 0 }: DashboardSummaryProps) {
  const stats = [
    { value: summary.tasks_today, label: "Tasks Today" },
    { value: totalZones, label: "Zones" },
    { value: summary.zones_watered_yesterday, label: "Watered Yesterday" },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center justify-center rounded-lg border bg-white p-4 min-h-[80px]"
        >
          <span className="text-2xl font-bold text-farm-green">{stat.value}</span>
          <span className="text-xs text-gray-500 text-center leading-tight mt-1">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}

export function DashboardSummarySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center justify-center rounded-lg border bg-white p-4 min-h-[80px]">
          <Skeleton className="h-7 w-8 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}
