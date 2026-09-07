"""Tests for Flashcard Set creation, updating, folder assignments, and search/filtering."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_set(async_client: AsyncClient) -> None:
    """Test creating a set in root workspace and fetching it."""
    response = await async_client.post(
        "/api/v1/sets",
        json={
            "name": "Cell Biology Terms",
            "description": "Essential definitions for cellular structures",
            "tags": ["Biology", "Cells", "Exam1"],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Cell Biology Terms"
    assert data["description"] == "Essential definitions for cellular structures"
    assert data["cardCount"] == 0
    assert data["tags"] == ["Biology", "Cells", "Exam1"]
    assert data["folderId"] is None
    set_id = data["id"]

    # Get set
    get_res = await async_client.get(f"/api/v1/sets/{set_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == set_id


@pytest.mark.asyncio
async def test_set_in_folder_and_moving(async_client: AsyncClient) -> None:
    """Test creating a set inside a folder and moving it."""
    # Create folder A and folder B
    f_a = (await async_client.post("/api/v1/folders", json={"name": "Folder A"})).json()
    f_b = (await async_client.post("/api/v1/folders", json={"name": "Folder B"})).json()

    # Create set in Folder A
    set_res = await async_client.post(
        "/api/v1/sets",
        json={"name": "Set in A", "folderId": f_a["id"]},
    )
    assert set_res.status_code == 201
    set_id = set_res.json()["id"]
    assert set_res.json()["folderId"] == f_a["id"]

    # Move set to Folder B
    move_res = await async_client.patch(
        f"/api/v1/sets/{set_id}",
        json={"folderId": f_b["id"]},
    )
    assert move_res.status_code == 200
    assert move_res.json()["folderId"] == f_b["id"]

    # Move set to root
    root_res = await async_client.patch(
        f"/api/v1/sets/{set_id}",
        json={"moveToRoot": True},
    )
    assert root_res.status_code == 200
    assert root_res.json()["folderId"] is None


@pytest.mark.asyncio
async def test_filter_and_search_sets(async_client: AsyncClient) -> None:
    """Test filtering sets by tag and searching by query term."""
    await async_client.post(
        "/api/v1/sets",
        json={"name": "Organic Chemistry Reactions", "tags": ["chemistry", "premed"]},
    )
    await async_client.post(
        "/api/v1/sets",
        json={"name": "Inorganic Chemistry Elements", "tags": ["chemistry"]},
    )
    await async_client.post(
        "/api/v1/sets",
        json={"name": "World History 101", "tags": ["history"]},
    )

    # Filter by tag
    tag_res = await async_client.get("/api/v1/sets?tag=chemistry")
    assert tag_res.status_code == 200
    assert len(tag_res.json()) == 2

    # Filter by search term
    search_res = await async_client.get("/api/v1/sets?search=Reactions")
    assert search_res.status_code == 200
    assert len(search_res.json()) == 1
    assert search_res.json()[0]["name"] == "Organic Chemistry Reactions"


@pytest.mark.asyncio
async def test_delete_set(async_client: AsyncClient) -> None:
    """Test deleting a set."""
    create_res = await async_client.post("/api/v1/sets", json={"name": "To be deleted"})
    set_id = create_res.json()["id"]

    del_res = await async_client.delete(f"/api/v1/sets/{set_id}")
    assert del_res.status_code == 204

    get_res = await async_client.get(f"/api/v1/sets/{set_id}")
    assert get_res.status_code == 404
