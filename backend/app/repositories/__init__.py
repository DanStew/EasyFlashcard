"""Repositories package."""

from app.repositories.base import (
    IFlashcardRepository,
    IFolderRepository,
    ISetRepository,
)
from app.repositories.firestore_repo import (
    FirestoreFlashcardRepository,
    FirestoreFolderRepository,
    FirestoreSetRepository,
)
from app.repositories.memory_repo import (
    InMemoryFlashcardRepository,
    InMemoryFolderRepository,
    InMemorySetRepository,
)

__all__ = [
    "FirestoreFlashcardRepository",
    "FirestoreFolderRepository",
    "FirestoreSetRepository",
    "IFlashcardRepository",
    "IFolderRepository",
    "ISetRepository",
    "InMemoryFlashcardRepository",
    "InMemoryFolderRepository",
    "InMemorySetRepository",
]
