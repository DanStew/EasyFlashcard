"""In-memory thread-safe repository implementations for local development and testing."""

import asyncio

from app.models.flashcard import Flashcard
from app.models.folder import Folder
from app.models.set import FlashcardSet
from app.repositories.base import IFlashcardRepository, IFolderRepository, ISetRepository


class InMemoryFolderRepository(IFolderRepository):
    """In-memory implementation of IFolderRepository."""

    def __init__(self) -> None:
        self._folders: dict[str, Folder] = {}
        self._lock = asyncio.Lock()

    async def create(self, folder: Folder) -> Folder:
        async with self._lock:
            self._folders[folder.id] = folder.model_copy(deep=True)
            return folder.model_copy(deep=True)

    async def get_by_id(self, folder_id: str, user_id: str) -> Folder | None:
        async with self._lock:
            folder = self._folders.get(folder_id)
            if folder and folder.user_id == user_id:
                return folder.model_copy(deep=True)
            return None

    async def list_all_user_folders(self, user_id: str) -> list[Folder]:
        async with self._lock:
            return [f.model_copy(deep=True) for f in self._folders.values() if f.user_id == user_id]

    async def list_by_parent(self, parent_id: str | None, user_id: str) -> list[Folder]:
        async with self._lock:
            return [
                f.model_copy(deep=True)
                for f in self._folders.values()
                if f.user_id == user_id and f.parent_id == parent_id
            ]

    async def update(self, folder: Folder) -> Folder:
        async with self._lock:
            self._folders[folder.id] = folder.model_copy(deep=True)
            return folder.model_copy(deep=True)

    async def update_bulk(self, folders: list[Folder]) -> None:
        async with self._lock:
            for folder in folders:
                self._folders[folder.id] = folder.model_copy(deep=True)

    async def delete(self, folder_id: str, user_id: str) -> bool:
        async with self._lock:
            folder = self._folders.get(folder_id)
            if folder and folder.user_id == user_id:
                del self._folders[folder_id]
                return True
            return False

    async def delete_bulk(self, folder_ids: list[str], user_id: str) -> int:
        async with self._lock:
            deleted_count = 0
            for fid in folder_ids:
                folder = self._folders.get(fid)
                if folder and folder.user_id == user_id:
                    del self._folders[fid]
                    deleted_count += 1
            return deleted_count

    def clear(self) -> None:
        """Utility for test suites to reset state."""
        self._folders.clear()


class InMemorySetRepository(ISetRepository):
    """In-memory implementation of ISetRepository."""

    def __init__(self) -> None:
        self._sets: dict[str, FlashcardSet] = {}
        self._lock = asyncio.Lock()

    async def create(self, set_obj: FlashcardSet) -> FlashcardSet:
        async with self._lock:
            self._sets[set_obj.id] = set_obj.model_copy(deep=True)
            return set_obj.model_copy(deep=True)

    async def get_by_id(self, set_id: str, user_id: str) -> FlashcardSet | None:
        async with self._lock:
            s = self._sets.get(set_id)
            if s and s.user_id == user_id:
                return s.model_copy(deep=True)
            return None

    async def list_by_user(
        self,
        user_id: str,
        folder_id: str | None = None,
        root_only: bool = False,
        tag: str | None = None,
        search: str | None = None,
    ) -> list[FlashcardSet]:
        async with self._lock:
            results = [s.model_copy(deep=True) for s in self._sets.values() if s.user_id == user_id]

            if root_only or folder_id == "root":
                results = [s for s in results if s.folder_id is None]
            elif folder_id is not None:
                # If explicitly querying specific folder
                results = [s for s in results if s.folder_id == folder_id]

            if tag:
                tag_lower = tag.lower()
                results = [s for s in results if any(t.lower() == tag_lower for t in s.tags)]

            if search:
                search_lower = search.lower()
                results = [
                    s
                    for s in results
                    if search_lower in s.name.lower()
                    or (s.description and search_lower in s.description.lower())
                ]

            return results

    async def list_by_folder(self, folder_id: str, user_id: str) -> list[FlashcardSet]:
        async with self._lock:
            return [
                s.model_copy(deep=True)
                for s in self._sets.values()
                if s.user_id == user_id and s.folder_id == folder_id
            ]

    async def list_by_folders(self, folder_ids: list[str], user_id: str) -> list[FlashcardSet]:
        target_ids = set(folder_ids)
        async with self._lock:
            return [
                s.model_copy(deep=True)
                for s in self._sets.values()
                if s.user_id == user_id and s.folder_id in target_ids
            ]

    async def update(self, set_obj: FlashcardSet) -> FlashcardSet:
        async with self._lock:
            self._sets[set_obj.id] = set_obj.model_copy(deep=True)
            return set_obj.model_copy(deep=True)

    async def delete(self, set_id: str, user_id: str) -> bool:
        async with self._lock:
            s = self._sets.get(set_id)
            if s and s.user_id == user_id:
                del self._sets[set_id]
                return True
            return False

    async def delete_by_folder_ids(self, folder_ids: list[str], user_id: str) -> int:
        target_ids = set(folder_ids)
        async with self._lock:
            deleted_count = 0
            to_delete = [
                s_id
                for s_id, s in self._sets.items()
                if s.user_id == user_id and s.folder_id in target_ids
            ]
            for s_id in to_delete:
                del self._sets[s_id]
                deleted_count += 1
            return deleted_count

    async def move_sets_to_folder(
        self, from_folder_id: str, to_folder_id: str | None, user_id: str
    ) -> int:
        async with self._lock:
            count = 0
            for s in self._sets.values():
                if s.user_id == user_id and s.folder_id == from_folder_id:
                    s.folder_id = to_folder_id
                    count += 1
            return count

    def clear(self) -> None:
        """Utility for test suites to reset state."""
        self._sets.clear()


class InMemoryFlashcardRepository(IFlashcardRepository):
    """In-memory implementation of IFlashcardRepository."""

    def __init__(self) -> None:
        self._cards: dict[str, Flashcard] = {}
        self._lock = asyncio.Lock()

    async def create(self, card: Flashcard) -> Flashcard:
        async with self._lock:
            self._cards[card.id] = card.model_copy(deep=True)
            return card.model_copy(deep=True)

    async def create_bulk(self, cards: list[Flashcard]) -> list[Flashcard]:
        async with self._lock:
            results = []
            for card in cards:
                self._cards[card.id] = card.model_copy(deep=True)
                results.append(card.model_copy(deep=True))
            return results

    async def get_by_id(self, card_id: str) -> Flashcard | None:
        async with self._lock:
            card = self._cards.get(card_id)
            return card.model_copy(deep=True) if card else None

    async def list_by_set(self, set_id: str) -> list[Flashcard]:
        async with self._lock:
            cards = [c.model_copy(deep=True) for c in self._cards.values() if c.set_id == set_id]
            cards.sort(key=lambda c: c.order_index)
            return cards

    async def update(self, card: Flashcard) -> Flashcard:
        async with self._lock:
            self._cards[card.id] = card.model_copy(deep=True)
            return card.model_copy(deep=True)

    async def update_bulk(self, cards: list[Flashcard]) -> None:
        async with self._lock:
            for card in cards:
                self._cards[card.id] = card.model_copy(deep=True)

    async def delete(self, card_id: str) -> bool:
        async with self._lock:
            if card_id in self._cards:
                del self._cards[card_id]
                return True
            return False

    async def delete_by_set_id(self, set_id: str) -> int:
        async with self._lock:
            to_delete = [cid for cid, c in self._cards.items() if c.set_id == set_id]
            for cid in to_delete:
                del self._cards[cid]
            return len(to_delete)

    async def delete_by_set_ids(self, set_ids: list[str]) -> int:
        target_sets = set(set_ids)
        async with self._lock:
            to_delete = [cid for cid, c in self._cards.items() if c.set_id in target_sets]
            for cid in to_delete:
                del self._cards[cid]
            return len(to_delete)

    async def count_by_set(self, set_id: str) -> int:
        async with self._lock:
            return sum(1 for c in self._cards.values() if c.set_id == set_id)

    def clear(self) -> None:
        """Utility for test suites to reset state."""
        self._cards.clear()
