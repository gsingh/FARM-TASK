from __future__ import annotations

from typing import Optional

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.models import Task
from app.tasks.schemas import TaskCreate, TaskUpdate


class TaskRepository:
    async def create(self, db: AsyncSession, data: TaskCreate) -> Task:
        task = Task(**data.model_dump())
        db.add(task)
        await db.commit()
        await db.refresh(task)
        return task

    async def get(self, db: AsyncSession, id: int) -> Task | None:
        result = await db.execute(select(Task).where(Task.id == id))
        return result.scalar_one_or_none()

    async def get_all(
        self,
        db: AsyncSession,
        page: int = 1,
        per_page: int = 20,
        zone_id: Optional[int] = None,
        status: Optional[str] = None,
        assigned_to: Optional[str] = None,
    ) -> tuple[list[Task], int]:
        query = select(Task)
        count_query = select(func.count()).select_from(Task)

        if zone_id is not None:
            query = query.where(Task.zone_id == zone_id)
            count_query = count_query.where(Task.zone_id == zone_id)
        if status is not None:
            query = query.where(Task.status == status)
            count_query = count_query.where(Task.status == status)
        if assigned_to is not None:
            query = query.where(Task.assigned_to == assigned_to)
            count_query = count_query.where(Task.assigned_to == assigned_to)

        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        offset = (page - 1) * per_page
        result = await db.execute(
            query.offset(offset).limit(per_page).order_by(Task.id)
        )
        tasks = list(result.scalars().all())
        return tasks, total

    async def update(self, db: AsyncSession, id: int, data: TaskUpdate) -> Task | None:
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return None
        task = await self.get(db, id)
        if not task:
            return None
        for key, value in update_data.items():
            setattr(task, key, value)
        await db.commit()
        await db.refresh(task)
        return task

    async def delete(self, db: AsyncSession, id: int) -> bool:
        result = await db.execute(delete(Task).where(Task.id == id))
        await db.commit()
        return result.rowcount > 0
