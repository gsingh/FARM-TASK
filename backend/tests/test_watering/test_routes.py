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
async def test_log_watering(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    response = await client.post(f"/api/zones/{zone_id}/water", json={
        "water_amount": 2.5,
        "notes": "Morning watering",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["error"] is None
    assert data["data"]["zone_id"] == zone_id
    assert data["data"]["water_amount"] == 2.5
    assert data["data"]["notes"] == "Morning watering"
    assert "id" in data["data"]
    assert "logged_at" in data["data"]


@pytest.mark.asyncio
async def test_log_watering_minimal(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    response = await client.post(f"/api/zones/{zone_id}/water", json={
        "water_amount": 1.0,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["error"] is None
    assert data["data"]["water_amount"] == 1.0
    assert data["data"]["notes"] is None


@pytest.mark.asyncio
async def test_log_watering_zone_not_found(client: AsyncClient):
    response = await client.post("/api/zones/99999/water", json={
        "water_amount": 2.5,
    })
    assert response.status_code == 404
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_log_watering_validation(client: AsyncClient):
    response = await client.post("/api/zones/1/water", json={})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_watering_history(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    await client.post(f"/api/zones/{zone_id}/water", json={"water_amount": 2.5})
    await client.post(f"/api/zones/{zone_id}/water", json={"water_amount": 3.0})

    response = await client.get(f"/api/zones/{zone_id}/water")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert len(data["data"]) == 2
    amounts = [e["water_amount"] for e in data["data"]]
    assert 3.0 in amounts
    assert 2.5 in amounts


@pytest.mark.asyncio
async def test_get_watering_history_empty(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    response = await client.get(f"/api/zones/{zone_id}/water")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"] == []


@pytest.mark.asyncio
async def test_get_watering_history_zone_not_found(client: AsyncClient):
    response = await client.get("/api/zones/99999/water")
    assert response.status_code == 404
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_generate_watering_schedule(client: AsyncClient, setup_zone):
    zone_id = setup_zone
    response = await client.post(f"/api/zones/{zone_id}/generate-schedule")
    assert response.status_code == 201
    data = response.json()
    assert data["error"] is None
    assert len(data["data"]) > 0
    for entry in data["data"]:
        assert "due_date" in entry
        assert "water_amount" in entry
        assert entry["label"] == "Regular watering"


@pytest.mark.asyncio
async def test_generate_watering_schedule_zone_not_found(client: AsyncClient):
    response = await client.post("/api/zones/99999/generate-schedule")
    assert response.status_code == 404
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_generate_watering_schedule_missing_cycle_params(client: AsyncClient, db_session):
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

    response = await client.post(f"/api/zones/{zone_id}/generate-schedule")
    assert response.status_code == 400
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "MISSING_CYCLE_PARAMS"
