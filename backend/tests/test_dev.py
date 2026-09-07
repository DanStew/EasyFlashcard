"""Tests for developer mode seed and reset API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dev_status(async_client: AsyncClient) -> None:
    """Ensure dev status endpoint reports current configuration."""
    response = await async_client.get("/api/v1/dev/status")
    assert response.status_code == 200
    data = response.json()
    assert data["storage_backend"] == "memory"
    assert data["dev_endpoints_enabled"] is True


@pytest.mark.asyncio
async def test_dev_seed_and_reset(async_client: AsyncClient) -> None:
    """Verify seeding creates folders, sets, and cards, and reset deletes them."""
    # 1. Trigger seed
    seed_res = await async_client.post("/api/v1/dev/seed?clear_existing=true")
    assert seed_res.status_code == 200
    seed_data = seed_res.json()
    assert seed_data["status"] == "success"
    assert seed_data["folders_created"] >= 6
    assert seed_data["sets_created"] >= 8
    assert seed_data["cards_created"] >= 30

    # 2. Check folders tree
    tree_res = await async_client.get("/api/v1/folders?as_tree=true")
    assert tree_res.status_code == 200
    tree = tree_res.json()
    assert len(tree) >= 3  # Root folders
    root_names = [f["name"] for f in tree]
    assert "Computer Science" in root_names
    assert "Medical & Life Sciences" in root_names
    assert "Languages & Linguistics" in root_names

    # Check nested subfolder
    cs_folder = next(f for f in tree if f["name"] == "Computer Science")
    assert len(cs_folder["subfolders"]) >= 2
    subfolder_names = [sf["name"] for sf in cs_folder["subfolders"]]
    assert "Algorithms & Data Structures" in subfolder_names

    # Check level 3 subfolder
    algo_folder = next(sf for sf in cs_folder["subfolders"] if sf["name"] == "Algorithms & Data Structures")
    assert len(algo_folder["subfolders"]) >= 1
    assert algo_folder["subfolders"][0]["name"] == "Advanced Optimization"

    # 3. Check sets list
    sets_res = await async_client.get("/api/v1/sets")
    assert sets_res.status_code == 200
    all_sets = sets_res.json()
    assert len(all_sets) >= 8

    # 4. Check root-only sets
    root_sets_res = await async_client.get("/api/v1/sets?root_only=true")
    assert root_sets_res.status_code == 200
    root_sets = root_sets_res.json()
    assert len(root_sets) >= 2
    root_set_names = [s["name"] for s in root_sets]
    assert "Mental Models & Cognitive Biases" in root_set_names

    # 5. Check cards in one of the sets
    bst_set = next(s for s in all_sets if "Binary Trees" in s["name"])
    cards_res = await async_client.get(f"/api/v1/sets/{bst_set['id']}/cards")
    assert cards_res.status_code == 200
    cards = cards_res.json()
    assert len(cards) >= 6

    # 6. Trigger reset
    reset_res = await async_client.post("/api/v1/dev/reset")
    assert reset_res.status_code == 200
    reset_data = reset_res.json()
    assert reset_data["status"] == "success"
    assert reset_data["deleted_folders"] >= 6
    assert reset_data["deleted_sets"] >= 8
    assert reset_data["deleted_cards"] >= 30

    # 7. Verify empty
    empty_tree_res = await async_client.get("/api/v1/folders")
    assert empty_tree_res.status_code == 200
    assert len(empty_tree_res.json()) == 0
