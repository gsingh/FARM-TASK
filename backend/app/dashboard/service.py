from datetime import datetime, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.models import Task
from app.watering.models import WateringLog
from app.zones.models import Zone


class DashboardService:
    async def get_summary(self, db: AsyncSession) -> dict:
        today = datetime.utcnow().date()
        tomorrow = today + timedelta(days=1)
        yesterday = today - timedelta(days=1)

        result = await db.execute(
            select(func.count(Task.id)).where(
                Task.due_date == today,
                Task.status == "pending",
            )
        )
        tasks_today = result.scalar() or 0

        result = await db.execute(
            select(func.count(Task.id)).where(
                Task.completed_at >= today,
                Task.completed_at < tomorrow,
                Task.status == "completed",
            )
        )
        completed_today = result.scalar() or 0

        result = await db.execute(
            select(func.count(func.distinct(WateringLog.zone_id))).where(
                WateringLog.logged_at >= yesterday,
                WateringLog.logged_at < today,
            )
        )
        zones_watered_yesterday = result.scalar() or 0

        result = await db.execute(
            select(func.count(Task.id)).where(
                Task.due_date < today,
                Task.status == "pending",
            )
        )
        overdue_count = result.scalar() or 0

        return {
            "tasks_today": tasks_today,
            "completed_today": completed_today,
            "zones_watered_yesterday": zones_watered_yesterday,
            "overdue_count": overdue_count,
        }

    async def get_today_pending(self, db: AsyncSession) -> list[dict]:
        today = datetime.utcnow().date()

        result = await db.execute(
            select(Task, Zone.name)
            .join(Zone, Task.zone_id == Zone.id)
            .where(
                Task.due_date == today,
                Task.status == "pending",
                Zone.is_active == True,
            )
            .order_by(Zone.name, Task.title)
        )
        rows = result.all()

        zone_groups: dict[int, dict] = {}
        for task, zone_name in rows:
            if task.zone_id not in zone_groups:
                zone_groups[task.zone_id] = {
                    "zone_id": task.zone_id,
                    "zone_name": zone_name,
                    "tasks": [],
                }
            zone_groups[task.zone_id]["tasks"].append({
                "id": task.id,
                "title": task.title,
                "due_date": task.due_date,
            })

        return list(zone_groups.values())
