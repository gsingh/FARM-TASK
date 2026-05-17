from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dashboard.schemas import (
    DashboardSummary,
    DashboardSummaryResponse,
    DashboardTodayResponse,
    ZoneTaskGroup,
)
from app.dashboard.service import DashboardService

router = APIRouter(tags=["dashboard"])
service = DashboardService()


@router.get("/api/dashboard/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    summary = await service.get_summary(db)
    return {"data": DashboardSummary(**summary), "error": None}


@router.get("/api/dashboard/today", response_model=DashboardTodayResponse)
async def get_dashboard_today(db: AsyncSession = Depends(get_db)):
    groups = await service.get_today_pending(db)
    return {"data": [ZoneTaskGroup(**g) for g in groups], "error": None}
