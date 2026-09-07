"""Set service containing business logic for flashcard sets management."""

from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.models.set import FlashcardSet, SetCreate, SetUpdate
from app.repositories.base import IFlashcardRepository, IFolderRepository, ISetRepository


class SetService:
    """Service layer for flashcard set management and organization."""

    def __init__(
        self,
        set_repo: ISetRepository,
        folder_repo: IFolderRepository,
        flashcard_repo: IFlashcardRepository,
    ) -> None:
        self.set_repo = set_repo
        self.folder_repo = folder_repo
        self.flashcard_repo = flashcard_repo

    async def create_set(self, data: SetCreate, user_id: str) -> FlashcardSet:
        """Create a new flashcard set within an optional folder."""
        if data.folder_id:
            folder = await self.folder_repo.get_by_id(data.folder_id, user_id)
            if not folder:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Parent folder '{data.folder_id}' not found.",
                )

        new_set = FlashcardSet(
            user_id=user_id,
            folder_id=data.folder_id,
            name=data.name.strip(),
            description=data.description.strip() if data.description else None,
            card_count=0,
            tags=[t.strip() for t in data.tags if t.strip()],
        )
        return await self.set_repo.create(new_set)

    async def get_set(self, set_id: str, user_id: str) -> FlashcardSet:
        """Retrieve a specific flashcard set by ID."""
        set_obj = await self.set_repo.get_by_id(set_id, user_id)
        if not set_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Flashcard set '{set_id}' not found.",
            )
        return set_obj

    async def list_sets(
        self,
        user_id: str,
        folder_id: str | None = None,
        root_only: bool = False,
        tag: str | None = None,
        search: str | None = None,
    ) -> list[FlashcardSet]:
        """List flashcard sets for a user with optional filters."""
        return await self.set_repo.list_by_user(
            user_id=user_id,
            folder_id=folder_id,
            root_only=root_only,
            tag=tag,
            search=search,
        )

    async def update_set(self, set_id: str, data: SetUpdate, user_id: str) -> FlashcardSet:
        """Update flashcard set metadata or move it to another folder."""
        set_obj = await self.get_set(set_id, user_id)

        if data.name is not None:
            set_obj.name = data.name.strip()

        if data.description is not None:
            set_obj.description = data.description.strip() if data.description else None

        if data.tags is not None:
            set_obj.tags = [t.strip() for t in data.tags if t.strip()]

        if data.move_to_root:
            set_obj.folder_id = None
        elif data.folder_id is not None and data.folder_id != set_obj.folder_id:
            folder = await self.folder_repo.get_by_id(data.folder_id, user_id)
            if not folder:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Target folder '{data.folder_id}' not found.",
                )
            set_obj.folder_id = data.folder_id

        set_obj.updated_at = datetime.now(UTC)
        return await self.set_repo.update(set_obj)

    async def delete_set(self, set_id: str, user_id: str) -> None:
        """Delete a flashcard set and all cards contained within it."""
        await self.get_set(set_id, user_id)
        # Delete associated flashcards first
        await self.flashcard_repo.delete_by_set_id(set_id)
        # Delete the set
        await self.set_repo.delete(set_id, user_id)
