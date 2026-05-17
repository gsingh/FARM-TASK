from typing import Optional

from fastapi import APIRouter, Depends, Path, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.tasks.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskSingleResponse,
    TaskListResponse,
    TaskListDataResponse,
)
from app.tasks.service import TaskService

router = APIRouter(tags=["tasks"])
service = TaskService()


@router.post("/api/tasks", response_model=TaskSingleResponse, status_code=201)
async def create_task(data: TaskCreate, db: AsyncSession = Depends(get_db)):
    task = await service.create_task(db, data)
    return {"data": TaskResponse.model_validate(task), "error": None}


@router.get("/api/tasks", response_model=TaskListResponse)
async def list_tasks(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    zone_id: Optional[int] = Query(None, gt=0),
    status: Optional[str] = Query(None, max_length=20),
    assigned_to: Optional[str] = Query(None, max_length=100),
    db: AsyncSession = Depends(get_db),
):
    tasks, total = await service.list_tasks(db, page, per_page, zone_id, status, assigned_to)
    return {
        "data": [TaskResponse.model_validate(t) for t in tasks],
        "total": total,
        "page": page,
        "error": None,
    }


@router.get("/api/tasks/{task_id}", response_model=TaskSingleResponse)
async def get_task(
    task_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
):
    task = await service.get_task(db, task_id)
    return {"data": TaskResponse.model_validate(task), "error": None}


@router.put("/api/tasks/{task_id}", response_model=TaskSingleResponse)
async def update_task(
    task_id: int = Path(..., gt=0),
    data: TaskUpdate = None,
    db: AsyncSession = Depends(get_db),
):
    if data is None:
        raise HTTPException(status_code=422, detail="Request body is required")
    task = await service.update_task(db, task_id, data)
    return {"data": TaskResponse.model_validate(task), "error": None}


@router.delete("/api/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
):
    await service.delete_task(db, task_id)


@router.post("/api/zones/{zone_id}/generate-tasks", response_model=TaskListDataResponse, status_code=201)
async def generate_tasks(
    zone_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
):
    tasks = await service.generate_tasks(db, zone_id)
    return {
        "data": [TaskResponse.model_validate(t) for t in tasks],
        "error": None,
    }
