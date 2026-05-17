from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.watering.models import WateringLog
from app.watering.schemas import WateringLogCreate


class WateringRepository:
    async def create(self, db: AsyncSession, zone_id: int, data: WateringLogCreate) -> WateringLog:
        log = WateringLog(zone_id=zone_id, **data.model_dump())
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    async def get_by_zone(self, db: AsyncSession, zone_id: int) -> list[WateringLog]:
        result = await db.execute(
            select(WateringLog)
            .where(WateringLog.zone_id == zone_id)
            .order_by(WateringLog.logged_at.asc())
        )
        return list(result.scalars().all())
