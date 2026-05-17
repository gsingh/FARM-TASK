export interface DashboardSummary {
  tasks_today: number
  completed_today: number
  zones_watered_yesterday: number
  overdue_count: number
}

export interface TaskBrief {
  id: number
  title: string
  due_date: string
}

export interface ZoneTaskGroup {
  zone_id: number
  zone_name: string
  tasks: TaskBrief[]
}

export interface DashboardSummaryResponse {
  data: DashboardSummary
  error: { code: string; message: string } | null
}

export interface DashboardTodayResponse {
  data: ZoneTaskGroup[]
  error: { code: string; message: string } | null
}
