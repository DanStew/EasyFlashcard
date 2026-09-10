"""Flashcard and CardFace domain models and request/response schemas."""

from datetime import datetime

from pydantic import Field

from app.models.common import CamelModel, generate_uuid, utc_now


class CardFace(CamelModel):
    """Represents one side of a flashcard (Term on front, or Definition on back)."""

    text: str = Field(
        ..., min_length=1, description="Text content (supports markdown and LaTeX formatting)."
    )
    image_url: str | None = Field(
        default=None, description="URL for optional accompanying diagram/image."
    )
    image_alt: str | None = Field(
        default=None, description="Alt description for accessibility and search indexing."
    )


class DocumentReference(CamelModel):
    """Citation metadata linking a flashcard back to its source document and page."""

    document_id: str = Field(..., description="Reference ID to the parent Document.")
    document_name: str = Field(
        ..., description="Cached file name of the document for quick display."
    )
    page_number: int = Field(..., ge=1, description="Exact 1-indexed page or slide number.")
    grounding_evidence: str | None = Field(
        default=None,
        description="Verbatim quote or excerpt proving this card is grounded in the document.",
    )


class Flashcard(CamelModel):
    """Domain model representing a complete study card containing front and back faces."""

    id: str = Field(default_factory=generate_uuid, description="Unique flashcard identifier.")
    set_id: str = Field(..., description="ID of the parent Set this card belongs to.")
    front: CardFace = Field(..., description="Term side of the flashcard.")
    back: CardFace = Field(..., description="Definition side of the flashcard.")
    order_index: int = Field(
        default=0, ge=0, description="Position/order of the card within its set."
    )
    source_reference: DocumentReference | None = Field(
        default=None, description="Citation metadata linking to source document/page."
    )
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class FlashcardCreate(CamelModel):
    """Schema for adding a single flashcard to a set."""

    front: CardFace = Field(..., description="Term / front face of the card.")
    back: CardFace = Field(..., description="Definition / back face of the card.")
    order_index: int | None = Field(
        default=None, description="Optional custom order position (defaults to end of set)."
    )
    source_reference: DocumentReference | None = Field(
        default=None, description="Optional source reference citation."
    )


class FlashcardBulkCreate(CamelModel):
    """Schema for batch-creating multiple flashcards in a set."""

    cards: list[FlashcardCreate] = Field(
        ..., min_length=1, description="List of flashcards to create in sequence."
    )


class FlashcardUpdate(CamelModel):
    """Schema for updating an existing flashcard."""

    front: CardFace | None = Field(default=None, description="Updated front face.")
    back: CardFace | None = Field(default=None, description="Updated back face.")
    order_index: int | None = Field(default=None, ge=0, description="Updated order position.")
    source_reference: DocumentReference | None = Field(
        default=None, description="Updated source reference citation."
    )


class FlashcardReorderRequest(CamelModel):
    """Schema for reordering flashcards in a set by providing ordered card IDs."""

    card_ids: list[str] = Field(
        ..., min_length=1, description="Complete list of card IDs in the desired target order."
    )


# Response schema alias for flashcard
FlashcardResponse = Flashcard
