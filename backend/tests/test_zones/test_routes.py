import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_zone(client: AsyncClient):
    response = await client.post("/api/zones", json={
        "name": "North Field",
        "crop_type": "corn",
        "planting_date": "2026-05-01",
        "estimated_cycle_days": 90,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["error"] is None
    assert data["data"]["name"] == "North Field"
    assert data["data"]["crop_type"] == "corn"
    assert data["data"]["planting_date"] == "2026-05-01"
    assert data["data"]["estimated_cycle_days"] == 90
    assert data["data"]["is_active"] is True
    assert "id" in data["data"]
    assert "created_at" in data["data"]
    assert "updated_at" in data["data"]


@pytest.mark.asyncio
async def test_create_zone_validation(client: AsyncClient):
    response = await client.post("/api/zones", json={
        "name": "Test",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_zones(client: AsyncClient):
    await client.post("/api/zones", json={
        "name": "North Field",
        "crop_type": "corn",
        "planting_date": "2026-05-01",
        "estimated_cycle_days": 90,
    })
    await client.post("/api/zones", json={
        "name": "South Field",
        "crop_type": "wheat",
        "planting_date": "2026-06-01",
        "estimated_cycle_days": 120,
    })

    response = await client.get("/api/zones")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert len(data["data"]) == 2
    assert data["total"] == 2
    assert data["page"] == 1


@pytest.mark.asyncio
async def test_list_zones_empty(client: AsyncClient):
    response = await client.get("/api/zones")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_get_zone(client: AsyncClient):
    create_resp = await client.post("/api/zones", json={
        "name": "North Field",
        "crop_type": "corn",
        "planting_date": "2026-05-01",
        "estimated_cycle_days": 90,
    })
    zone_id = create_resp.json()["data"]["id"]

    response = await client.get(f"/api/zones/{zone_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["id"] == zone_id
    assert data["data"]["name"] == "North Field"


@pytest.mark.asyncio
async def test_get_zone_not_found(client: AsyncClient):
    response = await client.get("/api/zones/99999")
    assert response.status_code == 404
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "NOT_FOUND"
    assert "not found" in data["error"]["message"].lower()


@pytest.mark.asyncio
async def test_update_zone(client: AsyncClient):
    create_resp = await client.post("/api/zones", json={
        "name": "North Field",
        "crop_type": "corn",
        "planting_date": "2026-05-01",
        "estimated_cycle_days": 90,
    })
    zone_id = create_resp.json()["data"]["id"]

    response = await client.put(f"/api/zones/{zone_id}", json={
        "name": "North Field East",
        "crop_type": "soy",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["name"] == "North Field East"
    assert data["data"]["crop_type"] == "soy"
    assert data["data"]["planting_date"] == "2026-05-01"


@pytest.mark.asyncio
async def test_update_zone_not_found(client: AsyncClient):
    response = await client.put("/api/zones/99999", json={
        "name": "Ghost Zone",
    })
    assert response.status_code == 404
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_delete_zone(client: AsyncClient):
    create_resp = await client.post("/api/zones", json={
        "name": "North Field",
        "crop_type": "corn",
        "planting_date": "2026-05-01",
        "estimated_cycle_days": 90,
    })
    zone_id = create_resp.json()["data"]["id"]

    response = await client.delete(f"/api/zones/{zone_id}")
    assert response.status_code == 204

    get_resp = await client.get(f"/api/zones/{zone_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_zone_not_found(client: AsyncClient):
    response = await client.delete("/api/zones/99999")
    assert response.status_code == 404
    data = response.json()
    assert data["data"] is None
    assert data["error"]["code"] == "NOT_FOUND"
