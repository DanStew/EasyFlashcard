"""Document and Google Drive domain models and request/response schemas."""

from datetime import datetime

from pydantic import Field

from app.models.common import CamelModel, generate_uuid, utc_now


class Document(CamelModel):
    """Domain model representing an uploaded/linked document in the user's EasyFlashcard Google Drive."""

    id: str = Field(default_factory=generate_uuid, description="Unique document identifier.")
    user_id: str = Field(..., description="ID of the user who owns the document.")
    name: str = Field(..., description="Original file name (e.g., lecture_04_biology.pdf).")
    mime_type: str = Field(..., description="MIME type of the document.")
    drive_file_id: str = Field(..., description="Google Drive File ID.")
    drive_folder_id: str | None = Field(
        default=None, description="Parent Google Drive folder ID."
    )
    web_view_link: str | None = Field(
        default=None, description="Google Drive embedded/browser preview URL."
    )
    web_content_link: str | None = Field(
        default=None, description="Direct download link for the file."
    )
    thumbnail_link: str | None = Field(
        default=None, description="URL for thumbnail image if available."
    )
    icon_link: str | None = Field(
        default=None, description="Google Drive file type icon URL."
    )
    size_bytes: int | None = Field(
        default=None, ge=0, description="File size in bytes if available."
    )
    page_count: int | None = Field(
        default=None, ge=1, description="Total number of pages or slides in the document."
    )
    linked_set_ids: list[str] = Field(
        default_factory=list, description="IDs of Flashcard Sets referencing this document."
    )
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class DriveFolderItem(CamelModel):
    """Represents a folder within the EasyFlashcard hierarchy in Google Drive."""

    id: str = Field(..., description="Google Drive folder ID.")
    name: str = Field(..., description="Name of the folder.")
    parent_id: str | None = Field(
        default=None, description="Parent Google Drive folder ID."
    )
    mime_type: str = Field(
        default="application/vnd.google-apps.folder", description="Google Drive folder MIME type."
    )
    created_at: datetime | None = Field(default=None)
    updated_at: datetime | None = Field(default=None)


class DriveBreadcrumb(CamelModel):
    """Represents a single path crumb in the Google Drive folder hierarchy."""

    id: str = Field(..., description="Google Drive folder ID.")
    name: str = Field(..., description="Name of the folder.")


class DriveFolderContentsResponse(CamelModel):
    """Response containing contents of the currently browsed Google Drive folder."""

    current_folder: DriveFolderItem = Field(
        ..., description="Metadata of the current directory."
    )
    breadcrumbs: list[DriveBreadcrumb] = Field(
        default_factory=list, description="Breadcrumb path from EasyFlashcard root to current folder."
    )
    subfolders: list[DriveFolderItem] = Field(
        default_factory=list, description="Subfolders inside the current folder."
    )
    files: list[Document] = Field(
        default_factory=list, description="Document files inside the current folder."
    )


class CreateSubfolderRequest(CamelModel):
    """Request payload to create a new subfolder in Google Drive."""

    name: str = Field(
        ..., min_length=1, max_length=120, description="Name for the new subfolder."
    )
    parent_folder_id: str | None = Field(
        default=None,
        description="Target parent folder ID (defaults to root EasyFlashcard folder if omitted).",
    )


class MoveItemRequest(CamelModel):
    """Request payload to move a file or folder within Google Drive."""

    item_id: str = Field(..., description="ID of the file or folder to move.")
    target_folder_id: str = Field(..., description="Target destination folder ID.")
    source_folder_id: str | None = Field(
        default=None, description="Current parent folder ID to remove."
    )


class RenameItemRequest(CamelModel):
    """Request payload to rename a file or folder in Google Drive."""

    name: str = Field(
        ..., min_length=1, max_length=120, description="New name for the file or folder."
    )
