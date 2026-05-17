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
import type { Zone } from "@/types/zone"
import type { WateringLogCreatePayload } from "@/types/watering"

interface WaterLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zones: Zone[]
  preselectedZoneId?: number
  onSave: (zoneId: number, data: WateringLogCreatePayload) => Promise<void>
}

export function WaterLogDialog({ open, onOpenChange, zones, preselectedZoneId, onSave }: WaterLogDialogProps) {
  const [zoneId, setZoneId] = useState("")
  const [waterAmount, setWaterAmount] = useState("5.0")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setZoneId(preselectedZoneId ? String(preselectedZoneId) : "")
      setWaterAmount("5.0")
      setNotes("")
    }
  }, [open, preselectedZoneId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(Number(zoneId), {
        water_amount: Number(waterAmount),
        notes: notes.trim() || null,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const isValid = zoneId.length > 0 && Number(waterAmount) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Watering</DialogTitle>
          <DialogDescription>Record watering for a zone.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zone_id">Zone</Label>
            <Select value={zoneId} onValueChange={setZoneId} disabled={!!preselectedZoneId}>
              <SelectTrigger id="zone_id">
                <SelectValue placeholder="Select a zone" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={String(z.id)}>
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="water_amount">Water Amount (L)</Label>
            <Input
              id="water_amount"
              type="number"
              step="0.5"
              min="0.5"
              value={waterAmount}
              onChange={(e) => setWaterAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Morning watering"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || saving}>
              {saving ? "Logging..." : "Log Watering"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
