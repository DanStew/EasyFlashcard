"""
Abstract repository protocols for Folders, Sets, and Flashcards.
These abstract classes mean that the business logic doesn't care about the real implementation of the database. It only knows about the interface.
This makes it easy to switch between different database implementations.
"""

from typing import Protocol

from app.models.flashcard import Flashcard
from app.models.folder import Folder
from app.models.set import FlashcardSet


class IFolderRepository(Protocol):
    """Interface defining database operations for Folders."""

    async def create(self, folder: Folder) -> Folder:
        """Persist a new folder."""
        ...

    async def get_by_id(self, folder_id: str, user_id: str) -> Folder | None:
        """Fetch folder by its unique ID for a given user."""
        ...

    async def list_all_user_folders(self, user_id: str) -> list[Folder]:
        """Retrieve all folders belonging to a user."""
        ...

    async def list_by_parent(self, parent_id: str | None, user_id: str) -> list[Folder]:
        """Retrieve direct child folders under parent_id (or root if None)."""
        ...

    async def update(self, folder: Folder) -> Folder:
        """Update an existing folder."""
        ...

    async def update_bulk(self, folders: list[Folder]) -> None:
        """Batch update multiple folders."""
        ...

    async def delete(self, folder_id: str, user_id: str) -> bool:
        """Delete a single folder."""
        ...

    async def delete_bulk(self, folder_ids: list[str], user_id: str) -> int:
        """Batch delete multiple folders."""
        ...


class ISetRepository(Protocol):
    """Interface defining database operations for Flashcard Sets."""

    async def create(self, set_obj: FlashcardSet) -> FlashcardSet:
        """Persist a new flashcard set."""
        ...

    async def get_by_id(self, set_id: str, user_id: str) -> FlashcardSet | None:
        """Fetch set by its unique ID for a given user."""
        ...

    async def list_by_user(
        self,
        user_id: str,
        folder_id: str | None = None,
        root_only: bool = False,
        tag: str | None = None,
        search: str | None = None,
    ) -> list[FlashcardSet]:
        """Retrieve flashcard sets for a user with optional filters."""
        ...

    async def list_by_folder(self, folder_id: str, user_id: str) -> list[FlashcardSet]:
        """Retrieve all sets in a specific folder."""
        ...

    async def list_by_folders(self, folder_ids: list[str], user_id: str) -> list[FlashcardSet]:
        """Retrieve all sets belonging to any of the specified folder IDs."""
        ...

    async def update(self, set_obj: FlashcardSet) -> FlashcardSet:
        """Update an existing flashcard set."""
        ...

    async def delete(self, set_id: str, user_id: str) -> bool:
        """Delete a flashcard set."""
        ...

    async def delete_by_folder_ids(self, folder_ids: list[str], user_id: str) -> int:
        """Delete all sets located in any of the specified folder IDs."""
        ...

    async def move_sets_to_folder(
        self, from_folder_id: str, to_folder_id: str | None, user_id: str
    ) -> int:
        """Move all sets from one folder into another folder or root."""
        ...


class IFlashcardRepository(Protocol):
    """Interface defining database operations for Flashcards."""

    async def create(self, card: Flashcard) -> Flashcard:
        """Persist a new flashcard."""
        ...

    async def create_bulk(self, cards: list[Flashcard]) -> list[Flashcard]:
        """Batch persist multiple flashcards."""
        ...

    async def get_by_id(self, card_id: str) -> Flashcard | None:
        """Fetch flashcard by its unique ID."""
        ...

    async def list_by_set(self, set_id: str) -> list[Flashcard]:
        """Retrieve all flashcards for a set, ordered by order_index."""
        ...

    async def update(self, card: Flashcard) -> Flashcard:
        """Update an existing flashcard."""
        ...

    async def update_bulk(self, cards: list[Flashcard]) -> None:
        """Batch update multiple flashcards (e.g. reordering)."""
        ...

    async def delete(self, card_id: str) -> bool:
        """Delete a single flashcard."""
        ...

    async def delete_by_set_id(self, set_id: str) -> int:
        """Delete all flashcards associated with a set."""
        ...

    async def delete_by_set_ids(self, set_ids: list[str]) -> int:
        """Batch delete cards for multiple sets."""
        ...

    async def count_by_set(self, set_id: str) -> int:
        """Count total flashcards in a set."""
        ...
