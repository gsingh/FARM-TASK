import datetime
from typing import Optional

from pydantic import BaseModel, Field


COLOR_PATTERN = r"^#[0-9a-fA-F]{6}$"


class ZoneCreate(BaseModel):
    name: str = Field(..., max_length=100)
    crop_type: str = Field(..., max_length=100)
    planting_date: datetime.date
    estimated_cycle_days: int = Field(..., gt=0)
    color: Optional[str] = Field(None, max_length=7, pattern=COLOR_PATTERN)


class ZoneUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    crop_type: Optional[str] = Field(None, max_length=100)
    planting_date: Optional[datetime.date] = None
    estimated_cycle_days: Optional[int] = Field(None, gt=0)
    color: Optional[str] = Field(None, max_length=7, pattern=COLOR_PATTERN)


class ZoneResponse(BaseModel):
    id: int
    name: str
    crop_type: str
    planting_date: datetime.date
    estimated_cycle_days: int
    is_active: bool
    color: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class ZoneSingleResponse(BaseModel):
    data: ZoneResponse
    error: None = None


class ZoneListResponse(BaseModel):
    data: list[ZoneResponse]
    total: int
    page: int = 1
    error: None = None
