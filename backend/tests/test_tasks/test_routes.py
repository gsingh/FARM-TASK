import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def setup_zone(client: AsyncClient):
    response = await client.post("/api/zones", json={
        "name": "North Field",
        "crop_type": "corn",
        "planting_date": "2026-05-01",
        "estimated_cycle_days": 90,
    })
    return response.json()["data"]["id"]


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    response = await client.post("/api/tasks", json={
        "title": "Water tomatoes",
        "zone_id": zone_id,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["error"] is None
    assert data["data"]["title"] == "Water tomatoes"
    assert data["data"]["zone_id"] == zone_id
    assert data["data"]["status"] == "pending"
    assert "id" in data["data"]
    assert "created_at" in data["data"]


@pytest.mark.asyncio
async def test_create_task_with_all_fields(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    response = await client.post("/api/tasks", json={
        "title": "Water tomatoes",
        "zone_id": zone_id,
        "assigned_to": "john",
        "due_date": "2026-05-20",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["error"] is None
    assert data["data"]["assigned_to"] == "john"
    assert data["data"]["due_date"] == "2026-05-20"


@pytest.mark.asyncio
async def test_create_task_zone_not_found(client: AsyncClient):
    response = await client.post("/api/tasks", json={
        "title": "Water tomatoes",
        "zone_id": 99999,
    })
    assert response.status_code == 404
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_create_task_validation(client: AsyncClient):
    response = await client.post("/api/tasks", json={
        "title": "Test",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_tasks(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    await client.post("/api/tasks", json={"title": "Task 1", "zone_id": zone_id})
    await client.post("/api/tasks", json={"title": "Task 2", "zone_id": zone_id})

    response = await client.get("/api/tasks")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert len(data["data"]) == 2
    assert data["total"] == 2
    assert data["page"] == 1


@pytest.mark.asyncio
async def test_list_tasks_empty(client: AsyncClient):
    response = await client.get("/api/tasks")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_tasks_filter_by_zone(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    await client.post("/api/tasks", json={"title": "Task 1", "zone_id": zone_id})

    response = await client.get(f"/api/tasks?zone_id={zone_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1


@pytest.mark.asyncio
async def test_list_tasks_filter_by_status(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    await client.post("/api/tasks", json={"title": "Task 1", "zone_id": zone_id})

    response = await client.get("/api/tasks?status=pending")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1

    response = await client.get("/api/tasks?status=completed")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 0


@pytest.mark.asyncio
async def test_list_tasks_filter_by_assigned(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    await client.post("/api/tasks", json={"title": "Task 1", "zone_id": zone_id, "assigned_to": "john"})

    response = await client.get("/api/tasks?assigned_to=john")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1

    response = await client.get("/api/tasks?assigned_to=jane")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 0


@pytest.mark.asyncio
async def test_get_task(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    create_resp = await client.post("/api/tasks", json={
        "title": "Water tomatoes",
        "zone_id": zone_id,
    })
    task_id = create_resp.json()["data"]["id"]

    response = await client.get(f"/api/tasks/{task_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["id"] == task_id
    assert data["data"]["title"] == "Water tomatoes"


@pytest.mark.asyncio
async def test_get_task_not_found(client: AsyncClient):
    response = await client.get("/api/tasks/99999")
    assert response.status_code == 404
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_update_task(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    create_resp = await client.post("/api/tasks", json={
        "title": "Water tomatoes",
        "zone_id": zone_id,
    })
    task_id = create_resp.json()["data"]["id"]

    response = await client.put(f"/api/tasks/{task_id}", json={
        "title": "Water cucumbers",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["title"] == "Water cucumbers"


@pytest.mark.asyncio
async def test_complete_task(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    create_resp = await client.post("/api/tasks", json={
        "title": "Water tomatoes",
        "zone_id": zone_id,
    })
    task_id = create_resp.json()["data"]["id"]

    response = await client.put(f"/api/tasks/{task_id}", json={
        "status": "completed",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["status"] == "completed"
    assert data["data"]["completed_at"] is not None


@pytest.mark.asyncio
async def test_update_task_not_found(client: AsyncClient):
    response = await client.put("/api/tasks/99999", json={
        "title": "Ghost task",
    })
    assert response.status_code == 404
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_delete_task(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    create_resp = await client.post("/api/tasks", json={
        "title": "Water tomatoes",
        "zone_id": zone_id,
    })
    task_id = create_resp.json()["data"]["id"]

    response = await client.delete(f"/api/tasks/{task_id}")
    assert response.status_code == 204

    get_resp = await client.get(f"/api/tasks/{task_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_task_not_found(client: AsyncClient):
    response = await client.delete("/api/tasks/99999")
    assert response.status_code == 404
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_generate_tasks(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    response = await client.post(f"/api/zones/{zone_id}/generate-tasks")
    assert response.status_code == 201
    data = response.json()
    assert data["error"] is None
    assert len(data["data"]) == 5

    titles = [t["title"] for t in data["data"]]
    assert "Prepare soil for corn" in titles
    assert "Plant corn" in titles
    assert "Fertilize corn" in titles
    assert "Harvest corn" in titles
    assert "Irrigate corn" in titles

    for task in data["data"]:
        assert task["status"] == "pending"
        assert task["zone_id"] == zone_id


@pytest.mark.asyncio
async def test_generate_tasks_zone_not_found(client: AsyncClient):
    response = await client.post("/api/zones/99999/generate-tasks")
    assert response.status_code == 404
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_generate_tasks_missing_cycle_params(client: AsyncClient, db_session):
    from sqlalchemy import select
    from app.zones.models import Zone

    zone_resp = await client.post("/api/zones", json={
        "name": "Empty Zone",
        "crop_type": "other",
        "planting_date": "2026-05-01",
        "estimated_cycle_days": 90,
    })
    zone_id = zone_resp.json()["data"]["id"]

    result = await db_session.execute(select(Zone).where(Zone.id == zone_id))
    zone = result.scalar_one()
    zone.estimated_cycle_days = 0
    await db_session.commit()

    response = await client.post(f"/api/zones/{zone_id}/generate-tasks")
    assert response.status_code == 400
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "MISSING_CYCLE_PARAMS"
