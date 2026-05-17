import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., max_length=200)
    zone_id: int = Field(..., gt=0)
    assigned_to: Optional[str] = Field(None, max_length=100)
    due_date: Optional[datetime.date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    zone_id: Optional[int] = Field(None, gt=0)
    status: Optional[str] = Field(None, max_length=20)
    assigned_to: Optional[str] = Field(None, max_length=100)
    due_date: Optional[datetime.date] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    zone_id: int
    status: str
    assigned_to: Optional[str] = None
    due_date: Optional[datetime.date] = None
    completed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class TaskSingleResponse(BaseModel):
    data: TaskResponse
    error: None = None


class TaskListResponse(BaseModel):
    data: list[TaskResponse]
    total: int
    page: int = 1
    error: None = None


class TaskListDataResponse(BaseModel):
    data: list[TaskResponse]
    error: None = None
