from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.zones.models import Zone
from app.zones.repository import ZoneRepository
from app.zones.schemas import ZoneCreate, ZoneUpdate


class ZoneService:
    def __init__(self):
        self.repository = ZoneRepository()

    async def create_zone(self, db: AsyncSession, data: ZoneCreate) -> Zone:
        return await self.repository.create(db, data)

    async def get_zone(self, db: AsyncSession, id: int) -> Zone:
        zone = await self.repository.get(db, id)
        if not zone:
            raise AppException(message="Zone not found", status_code=404, code="NOT_FOUND")
        return zone

    async def list_zones(
        self, db: AsyncSession, page: int = 1, per_page: int = 20
    ) -> tuple[list[Zone], int]:
        return await self.repository.get_all(db, page, per_page)

    async def update_zone(
        self, db: AsyncSession, id: int, data: ZoneUpdate
    ) -> Zone:
        zone = await self.repository.update(db, id, data)
        if not zone:
            raise AppException(message="Zone not found", status_code=404, code="NOT_FOUND")
        return zone

    async def delete_zone(self, db: AsyncSession, id: int) -> None:
        deleted = await self.repository.soft_delete(db, id)
        if not deleted:
            raise AppException(message="Zone not found", status_code=404, code="NOT_FOUND")
