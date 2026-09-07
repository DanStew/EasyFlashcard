"""Global Search API endpoints for searching across folders and flashcard sets."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import Field

from app.dependencies import (
    get_current_user_id,
    get_folder_service,
    get_set_service,
)
from app.models.common import CamelModel
from app.models.folder import FolderResponse
from app.models.set import SetResponse
from app.services.folder_service import FolderService
from app.services.set_service import SetService

router = APIRouter(prefix="/api/v1/search", tags=["Search"])


class SearchResult(CamelModel):
    """Unified search result containing matching folders and flashcard sets."""

    folders: list[FolderResponse] = Field(
        default_factory=list, description="List of matching folders."
    )
    sets: list[SetResponse] = Field(
        default_factory=list, description="List of matching flashcard sets."
    )
    total_count: int = Field(
        default=0, description="Total number of combined matching items."
    )


@router.get(
    "",
    response_model=SearchResult,
    summary="Search folders and flashcard sets",
)
async def search_library(
    q: Annotated[str, Query(min_length=1, max_length=100, description="Search keyword")],
    user_id: Annotated[str, Depends(get_current_user_id)],
    folder_service: Annotated[FolderService, Depends(get_folder_service)],
    set_service: Annotated[SetService, Depends(get_set_service)],
    limit: Annotated[int, Query(ge=1, le=100, description="Maximum items per category")] = 20,
) -> SearchResult:
    """Perform a global library search across folders and flashcard sets (excluding cards)."""
    cleaned_query = q.strip()
    if not cleaned_query:
        return SearchResult(folders=[], sets=[], total_count=0)

    # Search folders (by name and path)
    folders = await folder_service.list_folders(user_id=user_id, search=cleaned_query)

    # Search sets (by name, description, and tags)
    sets = await set_service.list_sets(user_id=user_id, search=cleaned_query)

    matching_folders = folders[:limit]
    matching_sets = sets[:limit]

    return SearchResult(
        folders=matching_folders,
        sets=matching_sets,
        total_count=len(folders) + len(sets),
    )
