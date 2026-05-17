from fastapi import APIRouter, Depends, Path, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AppException
from app.watering.schemas import (
    WateringLogCreate,
    WateringLogResponse,
    WateringLogSingleResponse,
    WateringLogListResponse,
    ScheduleEntry,
    ScheduleListResponse,
)
from app.watering.service import WateringService

router = APIRouter(tags=["watering"])
service = WateringService()


@router.post("/api/zones/{zone_id}/water", response_model=WateringLogSingleResponse, status_code=201)
async def log_watering(
    zone_id: int = Path(..., gt=0),
    data: WateringLogCreate = None,
    db: AsyncSession = Depends(get_db),
):
    if data is None:
        raise AppException(message="Request body is required", status_code=422, code="VALIDATION_ERROR")
    log = await service.log_watering(db, zone_id, data)
    return {"data": WateringLogResponse.model_validate(log), "error": None}


@router.get("/api/zones/{zone_id}/water", response_model=WateringLogListResponse)
async def get_watering_history(
    zone_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
):
    logs = await service.get_history(db, zone_id)
    return {
        "data": [WateringLogResponse.model_validate(log) for log in logs],
        "error": None,
    }


@router.post("/api/zones/{zone_id}/generate-schedule", response_model=ScheduleListResponse, status_code=201)
async def generate_watering_schedule(
    zone_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
):
    schedule = await service.generate_schedule(db, zone_id)
    return {
        "data": [ScheduleEntry(**entry) for entry in schedule],
        "error": None,
    }
