import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Zone, ZoneCreatePayload, ZoneUpdatePayload } from "@/types/zone"

const CROP_TYPES = [
  { value: "corn", label: "Corn 🌽" },
  { value: "wheat", label: "Wheat 🌾" },
  { value: "rice", label: "Rice 🌾" },
  { value: "tomato", label: "Tomato 🍅" },
  { value: "lettuce", label: "Lettuce 🥬" },
  { value: "carrot", label: "Carrot 🥕" },
  { value: "pepper", label: "Pepper 🫑" },
  { value: "grapes", label: "Grapes 🍇" },
  { value: "apple", label: "Apple 🍎" },
  { value: "other", label: "Other 🌱" },
]

const ZONE_COLORS = [
  { value: "#4CAF50", label: "Green" },
  { value: "#2196F3", label: "Blue" },
  { value: "#FF9800", label: "Orange" },
  { value: "#9C27B0", label: "Purple" },
  { value: "#F44336", label: "Red" },
  { value: "#009688", label: "Teal" },
]

interface ZoneFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zone?: Zone
  onSave: (data: ZoneCreatePayload | ZoneUpdatePayload) => Promise<void>
}

export function ZoneFormDialog({ open, onOpenChange, zone, onSave }: ZoneFormDialogProps) {
  const isEditing = !!zone
  const [name, setName] = useState("")
  const [cropType, setCropType] = useState("")
  const [plantingDate, setPlantingDate] = useState("")
  const [cycleDays, setCycleDays] = useState("")
  const [color, setColor] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(zone?.name ?? "")
      setCropType(zone?.crop_type ?? "")
      setPlantingDate(zone?.planting_date ?? "")
      setCycleDays(zone ? String(zone.estimated_cycle_days) : "")
      setColor(zone?.color ?? "")
    }
  }, [open, zone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEditing) {
        const payload: ZoneUpdatePayload = {}
        const trimmedName = name.trim()
        if (trimmedName !== zone?.name) payload.name = trimmedName
        if (cropType !== zone?.crop_type) payload.crop_type = cropType
        if (plantingDate !== zone?.planting_date) payload.planting_date = plantingDate
        const cycleNum = Number(cycleDays)
        if (cycleNum !== zone?.estimated_cycle_days) payload.estimated_cycle_days = cycleNum
        if (color !== (zone?.color ?? "")) payload.color = color || null
        if (Object.keys(payload).length === 0) return
        await onSave(payload)
      } else {
        await onSave({
          name: name.trim(),
          crop_type: cropType,
          planting_date: plantingDate,
          estimated_cycle_days: Number(cycleDays),
          color: color || null,
        })
      }
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const cycleNum = Number(cycleDays)
  const isValid = name.trim().length > 0 && cropType.length > 0 && plantingDate.length > 0 && cycleNum > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Zone" : "Add Zone"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your zone details below." : "Fill in the details to create a new farm zone."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Zone Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Field"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crop_type">Crop Type</Label>
            <Select value={cropType} onValueChange={setCropType}>
              <SelectTrigger id="crop_type">
                <SelectValue placeholder="Select a crop" />
              </SelectTrigger>
              <SelectContent>
                {CROP_TYPES.map((crop) => (
                  <SelectItem key={crop.value} value={crop.value}>
                    {crop.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="planting_date">Planting Date</Label>
            <Input
              id="planting_date"
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cycle_days">Estimated Cycle (days)</Label>
            <Input
              id="cycle_days"
              type="number"
              min={1}
              value={cycleDays}
              onChange={(e) => setCycleDays(e.target.value)}
              placeholder="e.g. 90"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Zone Color (optional)</Label>
            <div className="flex gap-2">
              {ZONE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value === color ? "" : c.value)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    color === c.value ? "border-gray-900 scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Zone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


