import datetime

from pydantic import BaseModel


class TaskBrief(BaseModel):
    id: int
    title: str
    due_date: datetime.date


class ZoneTaskGroup(BaseModel):
    zone_id: int
    zone_name: str
    tasks: list[TaskBrief]


class DashboardSummary(BaseModel):
    tasks_today: int = 0
    completed_today: int = 0
    zones_watered_yesterday: int = 0
    overdue_count: int = 0


class DashboardSummaryResponse(BaseModel):
    data: DashboardSummary
    error: None = None


class DashboardTodayResponse(BaseModel):
    data: list[ZoneTaskGroup]
    error: None = None
