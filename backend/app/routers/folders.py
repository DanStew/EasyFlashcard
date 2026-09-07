"""Folder API endpoints for folder creation, listing, hierarchy navigation, and organization."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status

from app.dependencies import get_current_user_id, get_folder_service
from app.models.folder import (
    FolderCreate,
    FolderResponse,
    FolderTreeItem,
    FolderUpdate,
)
from app.services.folder_service import FolderService

router = APIRouter(prefix="/api/v1/folders", tags=["Folders"])


@router.post(
    "",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a folder",
)
async def create_folder(
    data: FolderCreate,
    user_id: Annotated[str, Depends(get_current_user_id)],
    folder_service: Annotated[FolderService, Depends(get_folder_service)],
) -> FolderResponse:
    """Create a new folder or subfolder for organizing flashcard sets."""
    return await folder_service.create_folder(data, user_id)


@router.get(
    "",
    response_model=list[FolderTreeItem] | list[FolderResponse],
    summary="List folders",
)
async def list_folders(
    user_id: Annotated[str, Depends(get_current_user_id)],
    folder_service: Annotated[FolderService, Depends(get_folder_service)],
    parent_id: str | None = Query(
        default=None,
        description="Filter by immediate parent folder ID (leave null for all folders).",
    ),
    root_only: bool = Query(
        default=False,
        description="If true, returns only folders at the root level.",
    ),
    as_tree: bool = Query(
        default=False,
        description="If true, returns the complete nested hierarchical tree structure.",
    ),
    search: str | None = Query(
        default=None,
        description="Search folders by name or path.",
    ),
) -> list[FolderTreeItem] | list[FolderResponse]:
    """List folders for the current user, flat or as a tree."""
    if as_tree:
        return await folder_service.get_folder_tree(user_id)
    return await folder_service.list_folders(
        user_id=user_id, parent_id=parent_id, root_only=root_only, search=search
    )


@router.get(
    "/tree",
    response_model=list[FolderTreeItem],
    summary="Get hierarchical folder tree",
)
async def get_folder_tree(
    user_id: Annotated[str, Depends(get_current_user_id)],
    folder_service: Annotated[FolderService, Depends(get_folder_service)],
) -> list[FolderTreeItem]:
    """Retrieve full hierarchical tree structure of folders including nested subfolders and set counts."""
    return await folder_service.get_folder_tree(user_id)


@router.get(
    "/{folder_id}",
    response_model=FolderResponse,
    summary="Get folder by ID",
)
async def get_folder(
    folder_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)],
    folder_service: Annotated[FolderService, Depends(get_folder_service)],
) -> FolderResponse:
    """Retrieve a single folder's details by its ID."""
    return await folder_service.get_folder(folder_id, user_id)


@router.patch(
    "/{folder_id}",
    response_model=FolderResponse,
    summary="Update or move a folder",
)
async def update_folder(
    folder_id: str,
    data: FolderUpdate,
    user_id: Annotated[str, Depends(get_current_user_id)],
    folder_service: Annotated[FolderService, Depends(get_folder_service)],
) -> FolderResponse:
    """Update a folder's name or move it to a different parent folder (with cycle prevention)."""
    return await folder_service.update_folder(folder_id, data, user_id)


@router.delete(
    "/{folder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a folder",
)
async def delete_folder(
    folder_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)],
    folder_service: Annotated[FolderService, Depends(get_folder_service)],
    cascade: bool = Query(
        default=False,
        description="If true, recursively deletes all subfolders, sets, and cards inside.",
    ),
) -> Response:
    """Delete a folder. If cascade is false, child items are moved up to the parent folder."""
    await folder_service.delete_folder(folder_id, user_id, cascade=cascade)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
