export interface Task {
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

export interface TaskCreatePayload {
  title: string
  zone_id: number
  assigned_to?: string | null
  due_date?: string | null
}

export interface TaskUpdatePayload {
  title?: string
  zone_id?: number
  status?: string
  assigned_to?: string | null
  due_date?: string | null
}

export interface TaskSingleResponse {
  data: Task
  error: { code: string; message: string } | null
}

export interface TaskListResponse {
  data: Task[]
  total: number
  page: number
  error: { code: string; message: string } | null
}

export interface TaskListDataResponse {
  data: Task[]
  error: { code: string; message: string } | null
}
