"""Repositories package."""

from app.repositories.base import (
    IDocumentRepository,
    IFlashcardRepository,
    IFolderRepository,
    ISetRepository,
    IUserIntegrationRepository,
)
from app.repositories.firestore_repo import (
    FirestoreDocumentRepository,
    FirestoreFlashcardRepository,
    FirestoreFolderRepository,
    FirestoreSetRepository,
    FirestoreUserIntegrationRepository,
)
from app.repositories.memory_repo import (
    InMemoryDocumentRepository,
    InMemoryFlashcardRepository,
    InMemoryFolderRepository,
    InMemorySetRepository,
    InMemoryUserIntegrationRepository,
)

__all__ = [
    "FirestoreDocumentRepository",
    "FirestoreFlashcardRepository",
    "FirestoreFolderRepository",
    "FirestoreSetRepository",
    "FirestoreUserIntegrationRepository",
    "IDocumentRepository",
    "IFlashcardRepository",
    "IFolderRepository",
    "ISetRepository",
    "IUserIntegrationRepository",
    "InMemoryDocumentRepository",
    "InMemoryFlashcardRepository",
    "InMemoryFolderRepository",
    "InMemorySetRepository",
    "InMemoryUserIntegrationRepository",
]

