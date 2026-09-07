"""Pytest fixtures and configuration."""

from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.dependencies import (
    _in_memory_flashcard_repo,
    _in_memory_folder_repo,
    _in_memory_set_repo,
)
from app.main import app


@pytest.fixture(autouse=True)
def reset_repositories() -> None:
    """Clear in-memory repositories before every test."""
    _in_memory_folder_repo.clear()
    _in_memory_set_repo.clear()
    _in_memory_flashcard_repo.clear()


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Provide an asynchronous HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        headers={"X-User-ID": "test_user_abc"},
    ) as client:
        yield client
