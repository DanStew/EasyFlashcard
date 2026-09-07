"""Flashcard service managing card CRUD, sequential ordering, and set count synchronization."""

from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.models.flashcard import (
    Flashcard,
    FlashcardBulkCreate,
    FlashcardCreate,
    FlashcardReorderRequest,
    FlashcardUpdate,
)
from app.models.set import FlashcardSet
from app.repositories.base import IFlashcardRepository, ISetRepository


class FlashcardService:
    """Service layer for flashcard CRUD operations and ordering."""

    def __init__(
        self,
        flashcard_repo: IFlashcardRepository,
        set_repo: ISetRepository,
    ) -> None:
        self.flashcard_repo = flashcard_repo
        self.set_repo = set_repo

    async def _get_and_verify_set(self, set_id: str, user_id: str) -> FlashcardSet:
        """Helper to ensure the set exists and belongs to the user."""
        set_obj = await self.set_repo.get_by_id(set_id, user_id)
        if not set_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Flashcard set '{set_id}' not found.",
            )
        return set_obj

    async def create_card(self, set_id: str, data: FlashcardCreate, user_id: str) -> Flashcard:
        """Create a single flashcard in a set and update card count."""
        set_obj = await self._get_and_verify_set(set_id, user_id)
        existing_cards = await self.flashcard_repo.list_by_set(set_id)

        target_order = data.order_index if data.order_index is not None else len(existing_cards)

        card = Flashcard(
            set_id=set_id,
            front=data.front,
            back=data.back,
            order_index=target_order,
            source_reference=data.source_reference,
        )

        created_card = await self.flashcard_repo.create(card)

        # Update set card count and timestamp
        set_obj.card_count = len(existing_cards) + 1
        set_obj.updated_at = datetime.now(UTC)
        await self.set_repo.update(set_obj)

        return created_card

    async def create_cards_bulk(
        self, set_id: str, data: FlashcardBulkCreate, user_id: str
    ) -> list[Flashcard]:
        """Batch-create multiple flashcards in a set and update card count."""
        set_obj = await self._get_and_verify_set(set_id, user_id)
        existing_cards = await self.flashcard_repo.list_by_set(set_id)
        start_index = len(existing_cards)

        new_cards: list[Flashcard] = []
        for i, card_data in enumerate(data.cards):
            order = card_data.order_index if card_data.order_index is not None else start_index + i
            new_cards.append(
                Flashcard(
                    set_id=set_id,
                    front=card_data.front,
                    back=card_data.back,
                    order_index=order,
                    source_reference=card_data.source_reference,
                )
            )

        created = await self.flashcard_repo.create_bulk(new_cards)

        # Update set card count
        set_obj.card_count = start_index + len(created)
        set_obj.updated_at = datetime.now(UTC)
        await self.set_repo.update(set_obj)

        return created

    async def get_card(self, card_id: str, user_id: str) -> Flashcard:
        """Retrieve a specific flashcard, verifying user ownership of the parent set."""
        card = await self.flashcard_repo.get_by_id(card_id)
        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Flashcard '{card_id}' not found.",
            )
        await self._get_and_verify_set(card.set_id, user_id)
        return card

    async def list_cards_by_set(self, set_id: str, user_id: str) -> list[Flashcard]:
        """List all flashcards in a set in sequential order."""
        await self._get_and_verify_set(set_id, user_id)
        return await self.flashcard_repo.list_by_set(set_id)

    async def update_card(self, card_id: str, data: FlashcardUpdate, user_id: str) -> Flashcard:
        """Update flashcard face contents or order."""
        card = await self.get_card(card_id, user_id)

        if data.front is not None:
            card.front = data.front
        if data.back is not None:
            card.back = data.back
        if data.order_index is not None:
            card.order_index = data.order_index
        if data.source_reference is not None:
            card.source_reference = data.source_reference

        card.updated_at = datetime.now(UTC)
        updated_card = await self.flashcard_repo.update(card)

        # Touch set updated_at
        set_obj = await self._get_and_verify_set(card.set_id, user_id)
        set_obj.updated_at = datetime.now(UTC)
        await self.set_repo.update(set_obj)

        return updated_card

    async def delete_card(self, card_id: str, user_id: str) -> None:
        """Delete a single flashcard and adjust set card count and order indices."""
        card = await self.get_card(card_id, user_id)
        set_id = card.set_id
        set_obj = await self._get_and_verify_set(set_id, user_id)

        await self.flashcard_repo.delete(card_id)

        # Re-index remaining cards and update card_count
        remaining_cards = await self.flashcard_repo.list_by_set(set_id)
        needs_reindex = False
        for i, c in enumerate(remaining_cards):
            if c.order_index != i:
                c.order_index = i
                needs_reindex = True

        if needs_reindex:
            await self.flashcard_repo.update_bulk(remaining_cards)

        set_obj.card_count = len(remaining_cards)
        set_obj.updated_at = datetime.now(UTC)
        await self.set_repo.update(set_obj)

    async def reorder_cards(
        self, set_id: str, data: FlashcardReorderRequest, user_id: str
    ) -> list[Flashcard]:
        """Reorder cards in a set to match the provided sequence of IDs."""
        set_obj = await self._get_and_verify_set(set_id, user_id)
        existing_cards = await self.flashcard_repo.list_by_set(set_id)
        card_map = {c.id: c for c in existing_cards}

        if len(data.card_ids) != len(existing_cards) or set(data.card_ids) != set(card_map.keys()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provided card IDs must exactly match all cards in the set.",
            )

        updated_cards: list[Flashcard] = []
        for index, cid in enumerate(data.card_ids):
            c = card_map[cid]
            c.order_index = index
            c.updated_at = datetime.now(UTC)
            updated_cards.append(c)

        await self.flashcard_repo.update_bulk(updated_cards)

        set_obj.updated_at = datetime.now(UTC)
        await self.set_repo.update(set_obj)

        return sorted(updated_cards, key=lambda x: x.order_index)
