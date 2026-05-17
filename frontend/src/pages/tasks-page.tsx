import { useEffect, useState, useCallback } from "react"
import { useTaskStore } from "@/stores/task-store"
import { useZoneStore } from "@/stores/zone-store"
import { TaskRow, TaskRowSkeleton } from "@/components/task/task-row"
import { TaskFormDialog } from "@/components/task/task-form-dialog"
import { Button } from "@/components/ui/button"
import type { TaskCreatePayload } from "@/types/task"

export default function TasksPage() {
  const { tasks, total, isLoading, error, fetchTasks, createTask, completeTask, deleteTask } = useTaskStore()
  const { zones, fetchZones } = useZoneStore()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
    if (zones.length === 0) fetchZones()
  }, [fetchTasks, fetchZones, zones.length])

  const zoneMap = Object.fromEntries(zones.map((z) => [z.id, z.name]))

  const handleToggle = useCallback(async (id: number) => {
    setActionError(null)
    try {
      await completeTask(id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update task")
    }
  }, [completeTask])

  const handleCreate = useCallback(async (data: TaskCreatePayload) => {
    setActionError(null)
    try {
      await createTask(data)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to create task")
      throw err
    }
  }, [createTask])

  const handleDelete = useCallback(async (id: number) => {
    setActionError(null)
    try {
      await deleteTask(id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete task")
    }
  }, [deleteTask])

  if (isLoading && tasks.length === 0) {
    return (
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-9 w-28 animate-pulse rounded bg-gray-200" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <TaskRowSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-farm-green-dark">Tasks</h1>
          <p className="text-sm text-gray-500">
            {total > 0 ? `${total} task${total !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>Add Task</Button>
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {error && !actionError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => fetchTasks()} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {tasks.length === 0 && !isLoading && !error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl">🌾</span>
          <h2 className="mt-4 text-lg font-semibold text-gray-700">All done!</h2>
          <p className="mt-1 text-sm text-gray-500">No pending tasks. Add a new task to get started.</p>
          <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
            Add Task
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              zoneName={zoneMap[task.zone_id] ?? `Zone #${task.zone_id}`}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {isLoading && tasks.length > 0 && (
        <div className="space-y-2">
          {Array.from({ length: 1 }).map((_, i) => (
            <TaskRowSkeleton key={`loading-${i}`} />
          ))}
        </div>
      )}

      <TaskFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        zones={zones}
        onSave={handleCreate}
      />
    </div>
  )
}
