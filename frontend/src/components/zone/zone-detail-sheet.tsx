import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { ZoneFormDialog } from "@/components/zone/zone-form-dialog"
import type { Zone, ZoneUpdatePayload } from "@/types/zone"

interface ZoneDetailSheetProps {
  zone: Zone | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: number, data: ZoneUpdatePayload) => Promise<void>
  onDelete: (id: number) => void
}

export function ZoneDetailSheet({ zone, open, onOpenChange, onEdit, onDelete }: ZoneDetailSheetProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!zone) return null

  const handleEdit = async (data: ZoneUpdatePayload) => {
    await onEdit(zone.id, data)
    setShowEditDialog(false)
  }

  const handleDelete = async () => {
    try {
      await onDelete(zone.id)
    } catch {
      return
    }
    setShowDeleteConfirm(false)
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader className="mb-4">
            <div className="flex items-center gap-2">
              <SheetTitle>{zone.name}</SheetTitle>
              <StatusBadge variant={zone.is_active ? "active" : "scheduled"} />
            </div>
            <SheetDescription>
              {zone.crop_type} · Planted {zone.planting_date}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Crop Type</p>
                  <p className="font-medium">{zone.crop_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cycle</p>
                  <p className="font-medium">{zone.estimated_cycle_days} days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Planted</p>
                  <p className="font-medium">{zone.planting_date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium">{zone.is_active ? "Active" : "Inactive"}</p>
                </div>
              </div>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="mb-2 text-sm font-medium text-red-800">
                Are you sure you want to delete this zone?
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </div>
          )}

          <SheetFooter className="mt-4 flex-row gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setShowEditDialog(true)}>
              Edit
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => setShowDeleteConfirm(true)}>
              Delete
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ZoneFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        zone={zone}
        onSave={handleEdit}
      />
    </>
  )
}
