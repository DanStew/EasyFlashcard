"""Health endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient) -> None:
    """Test health endpoint returns 200 and healthy status."""
    for path in ("/health", "/api/v1/health"):
        response = await async_client.get(path)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data

