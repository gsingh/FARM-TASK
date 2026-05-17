import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.tasks.models import Task
from app.tasks.repository import TaskRepository
from app.tasks.schemas import TaskCreate, TaskUpdate
from app.scheduling.engine import generate_zone_tasks
from app.zones.repository import ZoneRepository


class TaskService:
    def __init__(self):
        self.repository = TaskRepository()
        self.zone_repository = ZoneRepository()

    async def create_task(self, db: AsyncSession, data: TaskCreate) -> Task:
        zone = await self.zone_repository.get(db, data.zone_id)
        if not zone:
            raise AppException(message="Zone not found", status_code=404, code="NOT_FOUND")
        return await self.repository.create(db, data)

    async def get_task(self, db: AsyncSession, id: int) -> Task:
        task = await self.repository.get(db, id)
        if not task:
            raise AppException(message="Task not found", status_code=404, code="NOT_FOUND")
        return task

    async def list_tasks(
        self,
        db: AsyncSession,
        page: int = 1,
        per_page: int = 20,
        zone_id: Optional[int] = None,
        status: Optional[str] = None,
        assigned_to: Optional[str] = None,
    ) -> tuple[list[Task], int]:
        return await self.repository.get_all(db, page, per_page, zone_id, status, assigned_to)

    async def update_task(self, db: AsyncSession, id: int, data: TaskUpdate) -> Task:
        task = await self.repository.get(db, id)
        if not task:
            raise AppException(message="Task not found", status_code=404, code="NOT_FOUND")
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise AppException(message="No fields to update", status_code=400, code="EMPTY_UPDATE")
        if update_data.get("status") == "completed" and not task.completed_at:
            update_data["completed_at"] = datetime.datetime.utcnow()
        for key, value in update_data.items():
            setattr(task, key, value)
        await db.commit()
        await db.refresh(task)
        return task

    async def delete_task(self, db: AsyncSession, id: int) -> None:
        deleted = await self.repository.delete(db, id)
        if not deleted:
            raise AppException(message="Task not found", status_code=404, code="NOT_FOUND")

    async def generate_tasks(self, db: AsyncSession, zone_id: int) -> list[Task]:
        zone = await self.zone_repository.get(db, zone_id)
        if not zone:
            raise AppException(message="Zone not found", status_code=404, code="NOT_FOUND")
        task_defs = generate_zone_tasks(zone)
        if not task_defs:
            raise AppException(
                message="Zone must have crop cycle parameters set",
                status_code=400,
                code="MISSING_CYCLE_PARAMS",
            )
        created = []
        for task_def in task_defs:
            create_data = TaskCreate(
                title=task_def["title"],
                zone_id=zone_id,
                due_date=task_def.get("due_date"),
            )
            task = await self.repository.create(db, create_data)
            created.append(task)
        return created
