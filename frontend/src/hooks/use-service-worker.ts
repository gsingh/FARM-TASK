import { useState, useEffect, useCallback, useRef } from "react"

interface UseServiceWorkerResult {
  needsRefresh: boolean
  updating: boolean
  offlineReady: boolean
  updateSW: () => void
}

export function useServiceWorker(): UseServiceWorkerResult {
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  const mountedRef = useRef(true)
  const hadControllerRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    hadControllerRef.current = !!navigator.serviceWorker?.controller

    if (!("serviceWorker" in navigator)) return

    const controllerChangeHandler = () => {
      if (!hadControllerRef.current) {
        hadControllerRef.current = true
        return
      }
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener("controllerchange", controllerChangeHandler)

    let currentRegistration: ServiceWorkerRegistration | null = null

    const handleUpdateFound = () => {
      if (!currentRegistration) return
      const newSW = currentRegistration.installing
      if (!newSW) return

      newSW.addEventListener("statechange", () => {
        if (newSW.state === "installed" && navigator.serviceWorker.controller) {
          setNeedsRefresh(true)
        }
      })
    }

    navigator.serviceWorker.ready.then((registration) => {
      if (!mountedRef.current) return
      currentRegistration = registration
      setOfflineReady(true)
      registration.addEventListener("updatefound", handleUpdateFound)
    }).catch(() => {
      // SW registration failed silently — app still works online
    })

    return () => {
      mountedRef.current = false
      currentRegistration = null
      navigator.serviceWorker.removeEventListener("controllerchange", controllerChangeHandler)
    }
  }, [])

  const updateSW = useCallback(() => {
    setUpdating(true)
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" })
      } else {
        setUpdating(false)
      }
    }).catch(() => {
      setUpdating(false)
    })
  }, [])

  return { needsRefresh, updating, offlineReady, updateSW }
}
