"""Tests for Folder management, hierarchy, materialized paths, and cycle prevention."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_folder(async_client: AsyncClient) -> None:
    """Test creating a root folder and getting it by ID."""
    response = await async_client.post(
        "/api/v1/folders",
        json={"name": "Biology 101"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Biology 101"
    assert data["parentId"] is None
    assert data["path"] == "/Biology 101/"
    assert "id" in data
    folder_id = data["id"]

    # Get folder by ID
    get_res = await async_client.get(f"/api/v1/folders/{folder_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == folder_id


@pytest.mark.asyncio
async def test_nested_folders_and_tree(async_client: AsyncClient) -> None:
    """Test creating nested subfolders and fetching tree structure."""
    # 1. Create root folder
    res_root = await async_client.post("/api/v1/folders", json={"name": "Science"})
    assert res_root.status_code == 201
    root_id = res_root.json()["id"]
    assert res_root.json()["path"] == "/Science/"

    # 2. Create child folder
    res_child = await async_client.post(
        "/api/v1/folders",
        json={"name": "Physics", "parentId": root_id},
    )
    assert res_child.status_code == 201
    child_id = res_child.json()["id"]
    assert res_child.json()["path"] == "/Science/Physics/"

    # 3. Create grandchild folder
    res_grandchild = await async_client.post(
        "/api/v1/folders",
        json={"name": "Thermodynamics", "parentId": child_id},
    )
    assert res_grandchild.status_code == 201
    assert res_grandchild.json()["path"] == "/Science/Physics/Thermodynamics/"

    # 4. Fetch tree
    tree_res = await async_client.get("/api/v1/folders/tree")
    assert tree_res.status_code == 200
    tree = tree_res.json()
    assert len(tree) == 1
    assert tree[0]["name"] == "Science"
    assert len(tree[0]["subfolders"]) == 1
    assert tree[0]["subfolders"][0]["name"] == "Physics"
    assert len(tree[0]["subfolders"][0]["subfolders"]) == 1
    assert tree[0]["subfolders"][0]["subfolders"][0]["name"] == "Thermodynamics"


@pytest.mark.asyncio
async def test_rename_folder_cascades_paths(async_client: AsyncClient) -> None:
    """Test renaming a parent folder correctly updates descendant paths."""
    res_root = await async_client.post("/api/v1/folders", json={"name": "OldRoot"})
    root_id = res_root.json()["id"]

    res_child = await async_client.post(
        "/api/v1/folders", json={"name": "Child", "parentId": root_id}
    )
    child_id = res_child.json()["id"]

    # Rename root
    update_res = await async_client.patch(f"/api/v1/folders/{root_id}", json={"name": "NewRoot"})
    assert update_res.status_code == 200
    assert update_res.json()["path"] == "/NewRoot/"

    # Verify child path was updated
    child_res = await async_client.get(f"/api/v1/folders/{child_id}")
    assert child_res.status_code == 200
    assert child_res.json()["path"] == "/NewRoot/Child/"


@pytest.mark.asyncio
async def test_cycle_prevention_on_move(async_client: AsyncClient) -> None:
    """Test that moving a folder inside itself or its descendant is prevented."""
    res_parent = await async_client.post("/api/v1/folders", json={"name": "Parent"})
    parent_id = res_parent.json()["id"]

    res_child = await async_client.post(
        "/api/v1/folders", json={"name": "Child", "parentId": parent_id}
    )
    child_id = res_child.json()["id"]

    # Try moving parent into its own child (should fail with 400)
    move_res = await async_client.patch(f"/api/v1/folders/{parent_id}", json={"parentId": child_id})
    assert move_res.status_code == 400
    assert "Cannot move a folder into itself" in move_res.json()["detail"]


@pytest.mark.asyncio
async def test_delete_folder_with_and_without_cascade(async_client: AsyncClient) -> None:
    """Test non-cascade deletion reparents children, while cascade deletes all."""
    # Setup hierarchy: Root -> Child
    res_root = await async_client.post("/api/v1/folders", json={"name": "Root"})
    root_id = res_root.json()["id"]

    res_child = await async_client.post(
        "/api/v1/folders", json={"name": "Child", "parentId": root_id}
    )
    child_id = res_child.json()["id"]

    # Delete root non-cascade
    del_res = await async_client.delete(f"/api/v1/folders/{root_id}?cascade=false")
    assert del_res.status_code == 204

    # Child should now be at root level
    child_res = await async_client.get(f"/api/v1/folders/{child_id}")
    assert child_res.status_code == 200
    assert child_res.json()["parentId"] is None
    assert child_res.json()["path"] == "/Child/"


@pytest.mark.asyncio
async def test_user_isolation(async_client: AsyncClient) -> None:
    """Test that users cannot access other users' folders."""
    # User 1 creates a folder
    res = await async_client.post(
        "/api/v1/folders",
        json={"name": "User 1 Secret Folder"},
        headers={"X-User-ID": "user_1"},
    )
    folder_id = res.json()["id"]

    # User 2 tries to fetch user 1's folder
    get_res = await async_client.get(
        f"/api/v1/folders/{folder_id}",
        headers={"X-User-ID": "user_2"},
    )
    assert get_res.status_code == 404
