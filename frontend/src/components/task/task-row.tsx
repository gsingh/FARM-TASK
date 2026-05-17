import { cn } from "@/lib/utils"
import type { Task } from "@/types/task"

function isOverdue(task: Task): boolean {
  if (task.status === "completed" || !task.due_date) return false
  const due = new Date(task.due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return due < today
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays === -1) return "Yesterday"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

interface TaskRowProps {
  task: Task
  zoneName: string
  onToggle: (id: number) => void
  onDelete?: (id: number) => void
}

export function TaskRow({ task, zoneName, onToggle, onDelete }: TaskRowProps) {
  const overdue = isOverdue(task)

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-white p-3 transition-shadow hover:shadow-sm",
        overdue && "border-red-200 bg-red-50"
      )}
    >
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full border-2 transition-colors min-h-[44px] min-w-[44px]",
            task.status === "completed"
              ? "border-green-500 bg-green-500 text-white"
              : overdue
                ? "border-red-400 hover:border-red-500"
                : "border-gray-300 hover:border-gray-400"
          )}
          aria-label={task.status === "completed" ? "Mark as pending" : overdue ? "Mark as complete, task is overdue" : "Mark as complete"}
        >
          {task.status === "completed" ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : overdue ? (
            <span className="text-sm text-red-500">!</span>
          ) : null}
        </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            task.status === "completed" && "text-gray-400 line-through",
            overdue && "text-red-700"
          )}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-farm-cream px-2 py-0.5 text-xs text-farm-green-dark">
            {zoneName}
          </span>
          {task.due_date && (
            <span
              className={cn(
                "text-xs",
                overdue ? "font-semibold text-red-600" : "text-gray-400"
              )}
            >
              {overdue && "⚠ "}{formatDueDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="shrink-0 min-h-[44px] min-w-[44px] text-gray-300 hover:text-red-500"
          aria-label={`Delete ${task.title}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}

export function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-3">
      <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-gray-200" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  )
}
