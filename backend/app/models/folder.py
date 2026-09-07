"""Folder domain models and request/response schemas."""

from datetime import datetime

from pydantic import Field

from app.models.common import CamelModel, generate_uuid, utc_now


class Folder(CamelModel):
    """Domain model representing a hierarchical organization folder."""

    id: str = Field(default_factory=generate_uuid, description="Unique folder identifier.")
    user_id: str = Field(..., description="ID of the user who owns the folder.")
    parent_id: str | None = Field(
        default=None, description="ID of the parent folder (None if at root level)."
    )
    name: str = Field(..., min_length=1, max_length=100, description="Name of the folder.")
    path: str = Field(
        default="",
        description="Materialized path (e.g. '/semester_1/biology/') for fast queries.",
    )
    subfolder_count: int = Field(default=0, description="Number of direct subfolders.")
    set_count: int = Field(default=0, description="Number of direct flashcard sets.")
    preview_items: list[str] = Field(
        default_factory=list,
        description="Names of child subfolders and sets inside for card previews.",
    )
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class FolderCreate(CamelModel):
    """Schema for creating a new folder."""

    name: str = Field(..., min_length=1, max_length=100, description="Name of the new folder.")
    parent_id: str | None = Field(
        default=None, description="Optional ID of parent folder if creating a subfolder."
    )


class FolderUpdate(CamelModel):
    """Schema for updating an existing folder."""

    name: str | None = Field(
        default=None, min_length=1, max_length=100, description="New folder name."
    )
    parent_id: str | None = Field(
        default=None,
        description="New parent folder ID (set to empty string or special value to move to root).",
    )
    move_to_root: bool = Field(
        default=False,
        description="Explicit flag to move folder to root level (parent_id = None).",
    )


# Response schema alias for folder
FolderResponse = Folder


class FolderTreeItem(Folder):
    """Hierarchical folder tree response schema containing nested children."""

    subfolders: list["FolderTreeItem"] = Field(
        default_factory=list, description="Child subfolders nested under this folder."
    )
    set_count: int = Field(default=0, description="Number of sets directly inside this folder.")
