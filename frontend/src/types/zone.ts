export interface Zone {
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

export interface ZoneCreatePayload {
  name: string
  crop_type: string
  planting_date: string
  estimated_cycle_days: number
  color?: string | null
}

export interface ZoneUpdatePayload {
  name?: string
  crop_type?: string
  planting_date?: string
  estimated_cycle_days?: number
  color?: string | null
}

export interface ZoneSingleResponse {
  data: Zone
  error: { code: string; message: string } | null
}

export interface ZoneListResponse {
  data: Zone[]
  total: number
  page: number
  error: { code: string; message: string } | null
}
