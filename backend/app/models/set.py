"""Flashcard Set domain models and request/response schemas."""

from datetime import datetime

from pydantic import Field

from app.models.common import CamelModel, generate_uuid, utc_now


class FlashcardSet(CamelModel):
    """Domain model representing a collection of flashcards designed to be studied together."""

    id: str = Field(default_factory=generate_uuid, description="Unique flashcard set identifier.")
    user_id: str = Field(..., description="ID of the user who owns the set.")
    folder_id: str | None = Field(
        default=None, description="ID of the parent Folder (None if in root workspace)."
    )
    name: str = Field(..., min_length=1, max_length=150, description="Name/title of the set.")
    description: str | None = Field(
        default=None, max_length=1000, description="Optional summary or description of the set."
    )
    card_count: int = Field(default=0, ge=0, description="Total count of flashcards in this set.")
    tags: list[str] = Field(
        default_factory=list, description="Categorization tags for filtering and search."
    )
    source_document_ids: list[str] = Field(
        default_factory=list, description="List of Document IDs referenced by this set."
    )
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class SetCreate(CamelModel):
    """Schema for creating a new flashcard set."""

    name: str = Field(..., min_length=1, max_length=150, description="Name of the flashcard set.")
    description: str | None = Field(
        default=None, max_length=1000, description="Optional set description."
    )
    folder_id: str | None = Field(
        default=None, description="Optional parent folder ID to organize this set under."
    )
    tags: list[str] = Field(default_factory=list, description="List of category/topic tags.")


class SetUpdate(CamelModel):
    """Schema for modifying set metadata or moving between folders."""

    name: str | None = Field(
        default=None, min_length=1, max_length=150, description="Updated set name."
    )
    description: str | None = Field(
        default=None, max_length=1000, description="Updated description."
    )
    folder_id: str | None = Field(
        default=None, description="New parent folder ID to move this set into."
    )
    move_to_root: bool = Field(
        default=False,
        description="Explicit flag to move this set to the root workspace (folder_id = None).",
    )
    tags: list[str] | None = Field(default=None, description="Updated list of tags.")


# Response schema alias for set
SetResponse = FlashcardSet
