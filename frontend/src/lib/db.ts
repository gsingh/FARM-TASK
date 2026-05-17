import Dexie, { type EntityTable } from "dexie"

export interface DexieZone {
  id: number
  name: string
  crop_type: string
  planting_date: string
  estimated_cycle_days: number
  is_active: boolean
  color: string | null
  created_at: string
  updated_at: string
}

export interface DexieTask {
  id: number
  title: string
  zone_id: number
  status: "pending" | "completed"
  assigned_to: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface DexieWateringLog {
  id: number
  zone_id: number
  water_amount: number
  notes: string | null
  logged_at: string
  created_at: string
}

export interface PendingChange {
  id?: number
  table: string
  urlPath?: string
  operation: "create" | "update" | "delete"
  data: Record<string, unknown>
  changeKey: string | number
  createdAt: string
}

class FarmTaskDB extends Dexie {
  zones!: EntityTable<DexieZone, "id">
  tasks!: EntityTable<DexieTask, "id">
  wateringLogs!: EntityTable<DexieWateringLog, "id">
  pendingChanges!: EntityTable<PendingChange, "id">

  constructor() {
    super("farm-task")
    this.version(1).stores({
      zones: "id, name, crop_type, is_active",
      tasks: "id, zone_id, status, assigned_to",
      wateringLogs: "id, zone_id, logged_at",
      pendingChanges: "++id, table, createdAt",
    })
  }
}

export const db = new FarmTaskDB()
