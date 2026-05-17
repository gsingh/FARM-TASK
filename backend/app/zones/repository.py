from __future__ import annotations

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.zones.models import Zone
from app.zones.schemas import ZoneCreate, ZoneUpdate


class ZoneRepository:
    async def create(self, db: AsyncSession, data: ZoneCreate) -> Zone:
        zone = Zone(**data.model_dump())
        db.add(zone)
        await db.commit()
        await db.refresh(zone)
        return zone

    async def get(self, db: AsyncSession, id: int) -> Zone | None:
        result = await db.execute(
            select(Zone).where(Zone.id == id, Zone.is_active == True)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self, db: AsyncSession, page: int = 1, per_page: int = 20
    ) -> tuple[list[Zone], int]:
        count_result = await db.execute(
            select(func.count()).select_from(Zone).where(Zone.is_active == True)
        )
        total = count_result.scalar() or 0

        offset = (page - 1) * per_page
        result = await db.execute(
            select(Zone)
            .where(Zone.is_active == True)
            .offset(offset)
            .limit(per_page)
            .order_by(Zone.id)
        )
        zones = list(result.scalars().all())
        return zones, total

    async def update(self, db: AsyncSession, id: int, data: ZoneUpdate) -> Zone | None:
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return None
        zone = await self.get(db, id)
        if not zone:
            return None
        for key, value in update_data.items():
            setattr(zone, key, value)
        await db.commit()
        await db.refresh(zone)
        return zone

    async def soft_delete(self, db: AsyncSession, id: int) -> bool:
        zone = await self.get(db, id)
        if not zone:
            return False
        zone.is_active = False
        await db.commit()
        return True
