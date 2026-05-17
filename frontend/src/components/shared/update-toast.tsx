import { useState } from "react"
import { useServiceWorker } from "@/hooks/use-service-worker"

export default function UpdateToast() {
  const { needsRefresh, updating, updateSW } = useServiceWorker()
  const [dismissed, setDismissed] = useState(false)

  if (!needsRefresh || dismissed) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 z-[60] mx-auto max-w-md animate-in slide-in-from-bottom-4"
    >
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg">
        <p className="text-sm text-gray-700">
          A new version is available.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => setDismissed(true)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-2 text-sm text-gray-500 hover:text-gray-700"
            aria-label="Dismiss update notification"
          >
            ✕
          </button>
          <button
            onClick={updateSW}
            disabled={updating}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-farm-green px-3 text-sm font-medium text-white hover:bg-farm-green/90 disabled:opacity-50"
          >
            {updating ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  )
}
