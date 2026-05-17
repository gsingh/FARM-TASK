import { useSync } from "@/hooks/use-sync"

export default function SyncIndicator() {
  const { syncStatus, pendingCount } = useSync()

  if (syncStatus === "idle") return null

  return (
    <div className="fixed bottom-20 right-4 z-[55]">
      <div className="flex min-h-[24px] min-w-[24px] items-center justify-center">
        {syncStatus === "syncing" && (
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400" title="Syncing..." />
        )}
        {syncStatus === "pending" && (
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" title={`${pendingCount} change${pendingCount !== 1 ? "s" : ""} pending sync`} />
        )}
        {syncStatus === "synced" && (
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" title="All changes synced" />
        )}
        {syncStatus === "error" && (
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" title="Sync failed" />
        )}
      </div>
    </div>
  )
}
