import { useState, useEffect } from "react"

const STORAGE_KEY = "farm-task-high-contrast"

function getStoredValue(): boolean {
  try {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(getStoredValue)

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", isHighContrast)
    try {
      localStorage.setItem(STORAGE_KEY, String(isHighContrast))
    } catch {
      /* storage unavailable — degrade silently */
    }
  }, [isHighContrast])

  const toggle = () => setIsHighContrast((prev) => !prev)

  return { isHighContrast, toggle }
}
