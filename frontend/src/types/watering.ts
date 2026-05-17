export interface WateringLog {
  id: number
  zone_id: number
  water_amount: number
  notes: string | null
  logged_at: string
  created_at: string
}

export interface WateringLogCreatePayload {
  water_amount: number
  notes?: string | null
}

export interface WateringLogListResponse {
  data: WateringLog[]
  error: { code: string; message: string } | null
}

export interface WateringLogSingleResponse {
  data: WateringLog
  error: { code: string; message: string } | null
}

export interface ScheduleEntry {
  due_date: string
  water_amount: number
  label: string
}

export interface ScheduleListResponse {
  data: ScheduleEntry[]
  error: { code: string; message: string } | null
}
