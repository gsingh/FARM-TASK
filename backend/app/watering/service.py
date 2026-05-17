from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.watering.models import WateringLog
from app.watering.repository import WateringRepository
from app.watering.schemas import WateringLogCreate
from app.zones.repository import ZoneRepository
from app.scheduling.calculator import generate_watering_schedule


class WateringService:
    def __init__(self):
        self.repository = WateringRepository()
        self.zone_repository = ZoneRepository()

    async def log_watering(self, db: AsyncSession, zone_id: int, data: WateringLogCreate) -> WateringLog:
        zone = await self.zone_repository.get(db, zone_id)
        if not zone:
            raise AppException(message="Zone not found", status_code=404, code="NOT_FOUND")
        return await self.repository.create(db, zone_id, data)

    async def get_history(self, db: AsyncSession, zone_id: int) -> list[WateringLog]:
        zone = await self.zone_repository.get(db, zone_id)
        if not zone:
            raise AppException(message="Zone not found", status_code=404, code="NOT_FOUND")
        return await self.repository.get_by_zone(db, zone_id)

    async def generate_schedule(self, db: AsyncSession, zone_id: int) -> list[dict]:
        zone = await self.zone_repository.get(db, zone_id)
        if not zone:
            raise AppException(message="Zone not found", status_code=404, code="NOT_FOUND")
        if not zone.estimated_cycle_days or zone.estimated_cycle_days <= 0 or not zone.planting_date:
            raise AppException(
                message="Zone must have crop cycle parameters set",
                status_code=400,
                code="MISSING_CYCLE_PARAMS",
            )
        return generate_watering_schedule(zone)
