"""Flashcard API endpoints for creating, listing, updating, reordering, and deleting flashcards."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.dependencies import get_current_user_id, get_flashcard_service
from app.models.flashcard import (
    FlashcardBulkCreate,
    FlashcardCreate,
    FlashcardReorderRequest,
    FlashcardResponse,
    FlashcardUpdate,
)
from app.services.flashcard_service import FlashcardService

router = APIRouter(tags=["Flashcards"])


@router.post(
    "/api/v1/sets/{set_id}/cards",
    response_model=FlashcardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add flashcard to set",
)
async def create_card(
    set_id: str,
    data: FlashcardCreate,
    user_id: Annotated[str, Depends(get_current_user_id)],
    flashcard_service: Annotated[FlashcardService, Depends(get_flashcard_service)],
) -> FlashcardResponse:
    """Create and add a single flashcard to the specified set."""
    return await flashcard_service.create_card(set_id, data, user_id)


@router.post(
    "/api/v1/sets/{set_id}/cards/bulk",
    response_model=list[FlashcardResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Batch add flashcards to set",
)
async def create_cards_bulk(
    set_id: str,
    data: FlashcardBulkCreate,
    user_id: Annotated[str, Depends(get_current_user_id)],
    flashcard_service: Annotated[FlashcardService, Depends(get_flashcard_service)],
) -> list[FlashcardResponse]:
    """Batch-create multiple flashcards in a set in a single request."""
    return await flashcard_service.create_cards_bulk(set_id, data, user_id)


@router.get(
    "/api/v1/sets/{set_id}/cards",
    response_model=list[FlashcardResponse],
    summary="List cards in a set",
)
async def list_cards_by_set(
    set_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)],
    flashcard_service: Annotated[FlashcardService, Depends(get_flashcard_service)],
) -> list[FlashcardResponse]:
    """List all flashcards in a set, ordered by their sequence index."""
    return await flashcard_service.list_cards_by_set(set_id, user_id)


@router.put(
    "/api/v1/sets/{set_id}/cards/reorder",
    response_model=list[FlashcardResponse],
    summary="Reorder cards in a set",
)
async def reorder_cards(
    set_id: str,
    data: FlashcardReorderRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
    flashcard_service: Annotated[FlashcardService, Depends(get_flashcard_service)],
) -> list[FlashcardResponse]:
    """Reorder cards in a set by providing the complete list of card IDs in new order."""
    return await flashcard_service.reorder_cards(set_id, data, user_id)


@router.get(
    "/api/v1/cards/{card_id}",
    response_model=FlashcardResponse,
    summary="Get flashcard by ID",
)
async def get_card(
    card_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)],
    flashcard_service: Annotated[FlashcardService, Depends(get_flashcard_service)],
) -> FlashcardResponse:
    """Retrieve full details of a single flashcard."""
    return await flashcard_service.get_card(card_id, user_id)


@router.patch(
    "/api/v1/cards/{card_id}",
    response_model=FlashcardResponse,
    summary="Update flashcard",
)
async def update_card(
    card_id: str,
    data: FlashcardUpdate,
    user_id: Annotated[str, Depends(get_current_user_id)],
    flashcard_service: Annotated[FlashcardService, Depends(get_flashcard_service)],
) -> FlashcardResponse:
    """Update front or back face of a flashcard, order index, or citation references."""
    return await flashcard_service.update_card(card_id, data, user_id)


@router.delete(
    "/api/v1/cards/{card_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete flashcard",
)
async def delete_card(
    card_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)],
    flashcard_service: Annotated[FlashcardService, Depends(get_flashcard_service)],
) -> Response:
    """Delete a flashcard from its set and update set card count."""
    await flashcard_service.delete_card(card_id, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
