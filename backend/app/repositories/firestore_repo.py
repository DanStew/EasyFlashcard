"""Google Cloud Firestore repository implementations for Folders, Sets, and Flashcards."""

from typing import Any

from google.cloud import firestore

from app.models.flashcard import Flashcard
from app.models.folder import Folder
from app.models.set import FlashcardSet
from app.repositories.base import IFlashcardRepository, IFolderRepository, ISetRepository


class FirestoreFolderRepository(IFolderRepository):
    """Firestore implementation of IFolderRepository."""

    def __init__(self, db: firestore.AsyncClient) -> None:
        self.db = db
        self.collection = db.collection("folders")

    async def create(self, folder: Folder) -> Folder:
        doc_ref = self.collection.document(folder.id)
        await doc_ref.set(folder.model_dump(by_alias=False))
        return folder

    async def get_by_id(self, folder_id: str, user_id: str) -> Folder | None:
        doc_ref = self.collection.document(folder_id)
        doc = await doc_ref.get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        if not data or data.get("user_id") != user_id:
            return None
        return Folder.model_validate(data)

    async def list_all_user_folders(self, user_id: str) -> list[Folder]:
        query = self.collection.where(filter=firestore.FieldFilter("user_id", "==", user_id))
        docs = await query.get()
        return [Folder.model_validate(doc.to_dict()) for doc in docs if doc.to_dict()]

    async def list_by_parent(self, parent_id: str | None, user_id: str) -> list[Folder]:
        query = self.collection.where(filter=firestore.FieldFilter("user_id", "==", user_id)).where(
            filter=firestore.FieldFilter("parent_id", "==", parent_id)
        )
        docs = await query.get()
        return [Folder.model_validate(doc.to_dict()) for doc in docs if doc.to_dict()]

    async def update(self, folder: Folder) -> Folder:
        doc_ref = self.collection.document(folder.id)
        await doc_ref.set(folder.model_dump(by_alias=False), merge=True)
        return folder

    async def update_bulk(self, folders: list[Folder]) -> None:
        batch = self.db.batch()
        for folder in folders:
            doc_ref = self.collection.document(folder.id)
            batch.set(doc_ref, folder.model_dump(by_alias=False), merge=True)
        await batch.commit()

    async def delete(self, folder_id: str, user_id: str) -> bool:
        doc_ref = self.collection.document(folder_id)
        doc = await doc_ref.get()
        data = doc.to_dict()
        if not doc.exists or not data or data.get("user_id") != user_id:
            return False
        await doc_ref.delete()
        return True

    async def delete_bulk(self, folder_ids: list[str], user_id: str) -> int:
        if not folder_ids:
            return 0
        batch = self.db.batch()
        count = 0
        for fid in folder_ids:
            doc_ref = self.collection.document(fid)
            batch.delete(doc_ref)
            count += 1
        await batch.commit()
        return count


class FirestoreSetRepository(ISetRepository):
    """Firestore implementation of ISetRepository."""

    def __init__(self, db: firestore.AsyncClient) -> None:
        self.db = db
        self.collection = db.collection("sets")

    async def create(self, set_obj: FlashcardSet) -> FlashcardSet:
        doc_ref = self.collection.document(set_obj.id)
        await doc_ref.set(set_obj.model_dump(by_alias=False))
        return set_obj

    async def get_by_id(self, set_id: str, user_id: str) -> FlashcardSet | None:
        doc_ref = self.collection.document(set_id)
        doc = await doc_ref.get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        if not data or data.get("user_id") != user_id:
            return None
        return FlashcardSet.model_validate(data)

    async def list_by_user(
        self,
        user_id: str,
        folder_id: str | None = None,
        root_only: bool = False,
        tag: str | None = None,
        search: str | None = None,
    ) -> list[FlashcardSet]:
        query = self.collection.where(filter=firestore.FieldFilter("user_id", "==", user_id))
        if root_only or folder_id == "root":
            query = query.where(filter=firestore.FieldFilter("folder_id", "==", None))
        elif folder_id is not None:
            query = query.where(filter=firestore.FieldFilter("folder_id", "==", folder_id))

        docs = await query.get()
        results = [FlashcardSet.model_validate(doc.to_dict()) for doc in docs if doc.to_dict()]

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
        query = self.collection.where(filter=firestore.FieldFilter("user_id", "==", user_id)).where(
            filter=firestore.FieldFilter("folder_id", "==", folder_id)
        )
        docs = await query.get()
        return [FlashcardSet.model_validate(doc.to_dict()) for doc in docs if doc.to_dict()]

    async def list_by_folders(self, folder_ids: list[str], user_id: str) -> list[FlashcardSet]:
        if not folder_ids:
            return []
        results: list[FlashcardSet] = []
        for i in range(0, len(folder_ids), 30):
            chunk = folder_ids[i : i + 30]
            query = self.collection.where(
                filter=firestore.FieldFilter("user_id", "==", user_id)
            ).where(filter=firestore.FieldFilter("folder_id", "in", chunk))
            docs = await query.get()
            results.extend([FlashcardSet.model_validate(d.to_dict()) for d in docs if d.to_dict()])
        return results

    async def update(self, set_obj: FlashcardSet) -> FlashcardSet:
        doc_ref = self.collection.document(set_obj.id)
        await doc_ref.set(set_obj.model_dump(by_alias=False), merge=True)
        return set_obj

    async def delete(self, set_id: str, user_id: str) -> bool:
        doc_ref = self.collection.document(set_id)
        doc = await doc_ref.get()
        data = doc.to_dict()
        if not doc.exists or not data or data.get("user_id") != user_id:
            return False
        await doc_ref.delete()
        return True

    async def delete_by_folder_ids(self, folder_ids: list[str], user_id: str) -> int:
        sets = await self.list_by_folders(folder_ids, user_id)
        if not sets:
            return 0
        batch = self.db.batch()
        for s in sets:
            batch.delete(self.collection.document(s.id))
        await batch.commit()
        return len(sets)

    async def move_sets_to_folder(
        self, from_folder_id: str, to_folder_id: str | None, user_id: str
    ) -> int:
        sets = await self.list_by_folder(from_folder_id, user_id)
        if not sets:
            return 0
        batch = self.db.batch()
        for s in sets:
            doc_ref = self.collection.document(s.id)
            batch.update(doc_ref, {"folder_id": to_folder_id})
        await batch.commit()
        return len(sets)


class FirestoreFlashcardRepository(IFlashcardRepository):
    """Firestore implementation of IFlashcardRepository."""

    def __init__(self, db: firestore.AsyncClient) -> None:
        self.db = db
        self.collection = db.collection("flashcards")

    async def create(self, card: Flashcard) -> Flashcard:
        doc_ref = self.collection.document(card.id)
        await doc_ref.set(card.model_dump(by_alias=False))
        return card

    async def create_bulk(self, cards: list[Flashcard]) -> list[Flashcard]:
        if not cards:
            return []
        batch = self.db.batch()
        for card in cards:
            doc_ref = self.collection.document(card.id)
            batch.set(doc_ref, card.model_dump(by_alias=False))
        await batch.commit()
        return cards

    async def get_by_id(self, card_id: str) -> Flashcard | None:
        doc_ref = self.collection.document(card_id)
        doc = await doc_ref.get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        if not data:
            return None
        return Flashcard.model_validate(data)

    async def list_by_set(self, set_id: str) -> list[Flashcard]:
        query = self.collection.where(filter=firestore.FieldFilter("set_id", "==", set_id))
        docs = await query.get()
        cards = [Flashcard.model_validate(doc.to_dict()) for doc in docs if doc.to_dict()]
        return sorted(cards, key=lambda c: c.order_index)

    async def update(self, card: Flashcard) -> Flashcard:
        doc_ref = self.collection.document(card.id)
        await doc_ref.set(card.model_dump(by_alias=False), merge=True)
        return card

    async def update_bulk(self, cards: list[Flashcard]) -> None:
        if not cards:
            return
        batch = self.db.batch()
        for card in cards:
            doc_ref = self.collection.document(card.id)
            batch.set(doc_ref, card.model_dump(by_alias=False), merge=True)
        await batch.commit()

    async def delete(self, card_id: str) -> bool:
        doc_ref = self.collection.document(card_id)
        doc = await doc_ref.get()
        if not doc.exists:
            return False
        await doc_ref.delete()
        return True

    async def delete_by_set_id(self, set_id: str) -> int:
        cards = await self.list_by_set(set_id)
        if not cards:
            return 0
        batch = self.db.batch()
        for c in cards:
            batch.delete(self.collection.document(c.id))
        await batch.commit()
        return len(cards)

    async def delete_by_set_ids(self, set_ids: list[str]) -> int:
        if not set_ids:
            return 0
        total_deleted = 0
        for s_id in set_ids:
            count = await self.delete_by_set_id(s_id)
            total_deleted += count
        return total_deleted

    async def count_by_set(self, set_id: str) -> int:
        query = self.collection.where(filter=firestore.FieldFilter("set_id", "==", set_id))
        count_query: Any = query.count()
        results: Any = await count_query.get()
        return int(results[0][0].value)
