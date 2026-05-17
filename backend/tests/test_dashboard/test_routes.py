from datetime import date, datetime, timedelta

import pytest
import pytest_asyncio
from httpx import AsyncClient


def _today_str():
    return date.today().isoformat()


def _yesterday_str():
    return (date.today() - timedelta(days=1)).isoformat()


def _tomorrow_str():
    return (date.today() + timedelta(days=1)).isoformat()


@pytest_asyncio.fixture
async def setup_zone(client: AsyncClient):
    response = await client.post("/api/zones", json={
        "name": "North Field",
        "crop_type": "corn",
        "planting_date": "2026-05-01",
        "estimated_cycle_days": 90,
    })
    return response.json()["data"]["id"]


@pytest_asyncio.fixture
async def setup_zones(client: AsyncClient):
    r1 = await client.post("/api/zones", json={
        "name": "North Field",
        "crop_type": "corn",
        "planting_date": "2026-05-01",
        "estimated_cycle_days": 90,
    })
    r2 = await client.post("/api/zones", json={
        "name": "South Field",
        "crop_type": "tomato",
        "planting_date": "2026-05-10",
        "estimated_cycle_days": 60,
    })
    return r1.json()["data"]["id"], r2.json()["data"]["id"]


@pytest.mark.asyncio
async def test_summary_empty(client: AsyncClient):
    response = await client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["tasks_today"] == 0
    assert data["data"]["completed_today"] == 0
    assert data["data"]["zones_watered_yesterday"] == 0
    assert data["data"]["overdue_count"] == 0


@pytest.mark.asyncio
async def test_summary_with_data(client: AsyncClient, setup_zone):
    zone_id = setup_zone

    await client.post(f"/api/zones/{zone_id}/water", json={"water_amount": 2.5})

    await client.post("/api/tasks", json={
        "title": "Water corn",
        "zone_id": zone_id,
        "due_date": _today_str(),
    })
    await client.post("/api/tasks", json={
        "title": "Weed rows",
        "zone_id": zone_id,
        "due_date": _today_str(),
    })
    await client.post("/api/tasks", json={
        "title": "Harvest tomatoes",
        "zone_id": zone_id,
        "due_date": _yesterday_str(),
    })

    tomorrow_id = (await client.post("/api/tasks", json={
        "title": "Fertilize",
        "zone_id": zone_id,
        "due_date": _tomorrow_str(),
    })).json()["data"]["id"]

    response = await client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["tasks_today"] == 2
    assert data["data"]["overdue_count"] == 1
    assert data["data"]["zones_watered_yesterday"] == 0

    await client.put(f"/api/tasks/{tomorrow_id}", json={"status": "completed"})

    response2 = await client.get("/api/dashboard/summary")
    assert response2.status_code == 200
    assert response2.json()["data"]["completed_today"] == 1


@pytest.mark.asyncio
async def test_today_empty(client: AsyncClient):
    response = await client.get("/api/dashboard/today")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"] == []


@pytest.mark.asyncio
async def test_today_with_tasks(client: AsyncClient, setup_zone):
    zone_id = setup_zone

    await client.post("/api/tasks", json={
        "title": "Water corn",
        "zone_id": zone_id,
        "due_date": _today_str(),
    })
    await client.post("/api/tasks", json={
        "title": "Weed corn",
        "zone_id": zone_id,
        "due_date": _today_str(),
    })

    await client.post("/api/tasks", json={
        "title": "Check pH",
        "zone_id": zone_id,
        "due_date": _tomorrow_str(),
    })

    response = await client.get("/api/dashboard/today")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert len(data["data"]) == 1
    assert data["data"][0]["zone_name"] == "North Field"
    assert len(data["data"][0]["tasks"]) == 2
    titles = [t["title"] for t in data["data"][0]["tasks"]]
    assert "Water corn" in titles
    assert "Weed corn" in titles


@pytest.mark.asyncio
async def test_today_grouped_by_zone(client: AsyncClient, setup_zones):
    zone1, zone2 = setup_zones

    await client.post("/api/tasks", json={
        "title": "Water corn",
        "zone_id": zone1,
        "due_date": _today_str(),
    })
    await client.post("/api/tasks", json={
        "title": "Water tomatoes",
        "zone_id": zone2,
        "due_date": _today_str(),
    })

    response = await client.get("/api/dashboard/today")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert len(data["data"]) == 2
    zone_names = {g["zone_name"] for g in data["data"]}
    assert zone_names == {"North Field", "South Field"}


@pytest.mark.asyncio
async def test_summary_zones_watered_yesterday(client: AsyncClient, setup_zone):
    zone_id = setup_zone

    yesterday = date.today() - timedelta(days=1)
    yesterday_dt = datetime.combine(yesterday, datetime.min.time())

    from app.watering.models import WateringLog
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        log = WateringLog(zone_id=zone_id, water_amount=3.0, logged_at=yesterday_dt)
        db.add(log)
        await db.commit()

    response = await client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["zones_watered_yesterday"] == 1
