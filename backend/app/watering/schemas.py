import datetime
from typing import Optional

from pydantic import BaseModel, Field


class WateringLogCreate(BaseModel):
    water_amount: float = Field(..., gt=0)
    notes: Optional[str] = Field(None, max_length=500)


class WateringLogResponse(BaseModel):
    id: int
    zone_id: int
    water_amount: float
    notes: Optional[str] = None
    logged_at: datetime.datetime
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class WateringLogSingleResponse(BaseModel):
    data: WateringLogResponse
    error: None = None


class WateringLogListResponse(BaseModel):
    data: list[WateringLogResponse]
    error: None = None


class ScheduleEntry(BaseModel):
    due_date: datetime.date
    water_amount: float
    label: str


class ScheduleListResponse(BaseModel):
    data: list[ScheduleEntry]
    error: None = None
