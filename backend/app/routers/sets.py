"""Flashcard Set API endpoints for creation, listing, searching, moving, and updating."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status

from app.dependencies import get_current_user_id, get_set_service
from app.models.set import SetCreate, SetResponse, SetUpdate
from app.services.set_service import SetService

router = APIRouter(prefix="/api/v1/sets", tags=["Sets"])


@router.post(
    "",
    response_model=SetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a flashcard set",
)
async def create_set(
    data: SetCreate,
    user_id: Annotated[str, Depends(get_current_user_id)],
    set_service: Annotated[SetService, Depends(get_set_service)],
) -> SetResponse:
    """Create a new flashcard set within an optional folder."""
    return await set_service.create_set(data, user_id)


@router.get(
    "",
    response_model=list[SetResponse],
    summary="List flashcard sets",
)
async def list_sets(
    user_id: Annotated[str, Depends(get_current_user_id)],
    set_service: Annotated[SetService, Depends(get_set_service)],
    folder_id: str | None = Query(default=None, description="Filter sets by containing folder ID."),
    root_only: bool = Query(default=False, description="Filter sets located at the root level."),
    tag: str | None = Query(default=None, description="Filter sets matching a specific tag."),
    search: str | None = Query(default=None, description="Search sets by name or description."),
) -> list[SetResponse]:
    """List and filter flashcard sets for the current user."""
    return await set_service.list_sets(
        user_id=user_id,
        folder_id=folder_id,
        root_only=root_only,
        tag=tag,
        search=search,
    )


@router.get(
    "/{set_id}",
    response_model=SetResponse,
    summary="Get flashcard set by ID",
)
async def get_set(
    set_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)],
    set_service: Annotated[SetService, Depends(get_set_service)],
) -> SetResponse:
    """Retrieve full details of a specific flashcard set."""
    return await set_service.get_set(set_id, user_id)


@router.patch(
    "/{set_id}",
    response_model=SetResponse,
    summary="Update flashcard set",
)
async def update_set(
    set_id: str,
    data: SetUpdate,
    user_id: Annotated[str, Depends(get_current_user_id)],
    set_service: Annotated[SetService, Depends(get_set_service)],
) -> SetResponse:
    """Update set title, description, tags, or move to another folder."""
    return await set_service.update_set(set_id, data, user_id)


@router.delete(
    "/{set_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete flashcard set",
)
async def delete_set(
    set_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)],
    set_service: Annotated[SetService, Depends(get_set_service)],
) -> Response:
    """Delete a flashcard set and all cards contained within it."""
    await set_service.delete_set(set_id, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
