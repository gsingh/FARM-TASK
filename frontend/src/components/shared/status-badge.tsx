import { cn } from "@/lib/utils"

type StatusVariant = "active" | "due" | "overdue" | "scheduled"

const variantStyles: Record<StatusVariant, string> = {
  active: "bg-[var(--status-active-bg)] text-white",
  due: "bg-[var(--status-due-bg)] text-white",
  overdue: "bg-[var(--status-overdue-bg)] text-white",
  scheduled: "bg-[var(--status-scheduled-bg)] text-white",
}

const variantLabels: Record<StatusVariant, string> = {
  active: "Active",
  due: "Due",
  overdue: "Overdue",
  scheduled: "Scheduled",
}

interface StatusBadgeProps {
  variant?: StatusVariant
  label?: string
  className?: string
}

export function StatusBadge({ variant = "active", label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {label ?? variantLabels[variant]}
    </span>
  )
}
