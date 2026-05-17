from fastapi import APIRouter, Depends, Path, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.zones.schemas import (
    ZoneCreate,
    ZoneUpdate,
    ZoneResponse,
    ZoneSingleResponse,
    ZoneListResponse,
)
from app.zones.service import ZoneService

router = APIRouter(tags=["zones"])
service = ZoneService()


@router.post("/api/zones", response_model=ZoneSingleResponse, status_code=201)
async def create_zone(data: ZoneCreate, db: AsyncSession = Depends(get_db)):
    zone = await service.create_zone(db, data)
    return {"data": ZoneResponse.model_validate(zone), "error": None}


@router.get("/api/zones", response_model=ZoneListResponse)
async def list_zones(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    zones, total = await service.list_zones(db, page, per_page)
    return {
        "data": [ZoneResponse.model_validate(z) for z in zones],
        "total": total,
        "page": page,
        "error": None,
    }


@router.get("/api/zones/{zone_id}", response_model=ZoneSingleResponse)
async def get_zone(
    zone_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
):
    zone = await service.get_zone(db, zone_id)
    return {"data": ZoneResponse.model_validate(zone), "error": None}


@router.put("/api/zones/{zone_id}", response_model=ZoneSingleResponse)
async def update_zone(
    zone_id: int = Path(..., gt=0),
    data: ZoneUpdate = None,
    db: AsyncSession = Depends(get_db),
):
    if data is None:
        raise HTTPException(status_code=422, detail="Request body is required")
    zone = await service.update_zone(db, zone_id, data)
    return {"data": ZoneResponse.model_validate(zone), "error": None}


@router.delete("/api/zones/{zone_id}", status_code=204)
async def delete_zone(
    zone_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
):
    await service.delete_zone(db, zone_id)
