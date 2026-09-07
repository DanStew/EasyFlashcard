"""Tests for Flashcard CRUD, ordering, bulk creation, and set count synchronization."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_flashcards_and_sync_count(async_client: AsyncClient) -> None:
    """Test adding single cards to a set and checking orderIndex and set cardCount."""
    # Create set
    set_res = await async_client.post("/api/v1/sets", json={"name": "Spanish Vocab"})
    set_id = set_res.json()["id"]

    # 1. Add first card
    c1_res = await async_client.post(
        f"/api/v1/sets/{set_id}/cards",
        json={
            "front": {"text": "Hola", "imageUrl": None},
            "back": {"text": "Hello", "imageUrl": None},
        },
    )
    assert c1_res.status_code == 201
    c1 = c1_res.json()
    assert c1["orderIndex"] == 0
    assert c1["front"]["text"] == "Hola"
    assert c1["back"]["text"] == "Hello"

    # Verify set card count is 1
    s_res = await async_client.get(f"/api/v1/sets/{set_id}")
    assert s_res.json()["cardCount"] == 1

    # 2. Add second card
    c2_res = await async_client.post(
        f"/api/v1/sets/{set_id}/cards",
        json={
            "front": {"text": "Adios"},
            "back": {"text": "Goodbye"},
        },
    )
    assert c2_res.status_code == 201
    assert c2_res.json()["orderIndex"] == 1

    # Verify set card count is 2
    s_res2 = await async_client.get(f"/api/v1/sets/{set_id}")
    assert s_res2.json()["cardCount"] == 2


@pytest.mark.asyncio
async def test_bulk_create_flashcards(async_client: AsyncClient) -> None:
    """Test bulk adding flashcards."""
    set_res = await async_client.post("/api/v1/sets", json={"name": "Bulk Set"})
    set_id = set_res.json()["id"]

    bulk_res = await async_client.post(
        f"/api/v1/sets/{set_id}/cards/bulk",
        json={
            "cards": [
                {"front": {"text": "Q1"}, "back": {"text": "A1"}},
                {"front": {"text": "Q2"}, "back": {"text": "A2"}},
                {"front": {"text": "Q3"}, "back": {"text": "A3"}},
            ]
        },
    )
    assert bulk_res.status_code == 201
    cards = bulk_res.json()
    assert len(cards) == 3
    assert [c["orderIndex"] for c in cards] == [0, 1, 2]

    # Verify set count is 3
    s_res = await async_client.get(f"/api/v1/sets/{set_id}")
    assert s_res.json()["cardCount"] == 3


@pytest.mark.asyncio
async def test_reorder_flashcards(async_client: AsyncClient) -> None:
    """Test reordering flashcards in a set."""
    set_res = await async_client.post("/api/v1/sets", json={"name": "Reorder Set"})
    set_id = set_res.json()["id"]

    c1 = (
        await async_client.post(
            f"/api/v1/sets/{set_id}/cards",
            json={"front": {"text": "First"}, "back": {"text": "1"}},
        )
    ).json()
    c2 = (
        await async_client.post(
            f"/api/v1/sets/{set_id}/cards",
            json={"front": {"text": "Second"}, "back": {"text": "2"}},
        )
    ).json()
    c3 = (
        await async_client.post(
            f"/api/v1/sets/{set_id}/cards",
            json={"front": {"text": "Third"}, "back": {"text": "3"}},
        )
    ).json()

    # Reorder: [c3, c1, c2]
    reorder_res = await async_client.put(
        f"/api/v1/sets/{set_id}/cards/reorder",
        json={"cardIds": [c3["id"], c1["id"], c2["id"]]},
    )
    assert reorder_res.status_code == 200
    reordered = reorder_res.json()
    assert [c["id"] for c in reordered] == [c3["id"], c1["id"], c2["id"]]
    assert [c["orderIndex"] for c in reordered] == [0, 1, 2]


@pytest.mark.asyncio
async def test_delete_flashcard_updates_card_count(async_client: AsyncClient) -> None:
    """Test deleting a card recalculates set cardCount and remaining order indices."""
    set_res = await async_client.post("/api/v1/sets", json={"name": "Card Count Set"})
    set_id = set_res.json()["id"]

    c1 = (
        await async_client.post(
            f"/api/v1/sets/{set_id}/cards",
            json={"front": {"text": "A"}, "back": {"text": "1"}},
        )
    ).json()
    c2 = (
        await async_client.post(
            f"/api/v1/sets/{set_id}/cards",
            json={"front": {"text": "B"}, "back": {"text": "2"}},
        )
    ).json()

    # Delete first card
    del_res = await async_client.delete(f"/api/v1/cards/{c1['id']}")
    assert del_res.status_code == 204

    # Set card count should now be 1
    s_res = await async_client.get(f"/api/v1/sets/{set_id}")
    assert s_res.json()["cardCount"] == 1

    # Remaining card (c2) should now be re-indexed to 0
    cards_res = await async_client.get(f"/api/v1/sets/{set_id}/cards")
    remaining = cards_res.json()
    assert len(remaining) == 1
    assert remaining[0]["id"] == c2["id"]
    assert remaining[0]["orderIndex"] == 0
