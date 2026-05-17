import { useHighContrast } from "@/hooks/use-high-contrast"

export default function HighContrastToggle() {
  const { isHighContrast, toggle } = useHighContrast()

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-foreground hover:bg-muted"
      aria-label={isHighContrast ? "Disable high contrast mode" : "Enable high contrast mode"}
      title={isHighContrast ? "High contrast on" : "High contrast off"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d={isHighContrast ? "M12 2a10 10 0 0 1 0 20z" : "M12 18a6 6 0 0 0 0-12z"} />
      </svg>
    </button>
  )
}
