"""FastAPI dependencies for dependency injection across routers."""

from typing import Annotated

from fastapi import Depends, Header

from app.config import settings
from app.repositories.base import (
    IFlashcardRepository,
    IFolderRepository,
    ISetRepository,
)
from app.repositories.memory_repo import (
    InMemoryFlashcardRepository,
    InMemoryFolderRepository,
    InMemorySetRepository,
)
from app.services.flashcard_service import FlashcardService
from app.services.folder_service import FolderService
from app.services.seed_service import SeedService
from app.services.set_service import SetService

# Global repository singletons for in-memory mode
_in_memory_folder_repo = InMemoryFolderRepository()
_in_memory_set_repo = InMemorySetRepository()
_in_memory_flashcard_repo = InMemoryFlashcardRepository()


def get_folder_repository() -> IFolderRepository:
    """Return configured Folder repository."""
    if settings.storage_backend == "firestore":
        from google.cloud import firestore

        from app.repositories.firestore_repo import FirestoreFolderRepository

        db = firestore.AsyncClient(
            project=settings.firebase_project_id,
            database=settings.firestore_database,
        )
        return FirestoreFolderRepository(db)
    return _in_memory_folder_repo


def get_set_repository() -> ISetRepository:
    """Return configured Set repository."""
    if settings.storage_backend == "firestore":
        from google.cloud import firestore

        from app.repositories.firestore_repo import FirestoreSetRepository

        db = firestore.AsyncClient(
            project=settings.firebase_project_id,
            database=settings.firestore_database,
        )
        return FirestoreSetRepository(db)
    return _in_memory_set_repo


def get_flashcard_repository() -> IFlashcardRepository:
    """Return configured Flashcard repository."""
    if settings.storage_backend == "firestore":
        from google.cloud import firestore

        from app.repositories.firestore_repo import FirestoreFlashcardRepository

        db = firestore.AsyncClient(
            project=settings.firebase_project_id,
            database=settings.firestore_database,
        )
        return FirestoreFlashcardRepository(db)
    return _in_memory_flashcard_repo


def get_folder_service(
    folder_repo: Annotated[IFolderRepository, Depends(get_folder_repository)],
    set_repo: Annotated[ISetRepository, Depends(get_set_repository)],
    flashcard_repo: Annotated[IFlashcardRepository, Depends(get_flashcard_repository)],
) -> FolderService:
    """Return FolderService instance."""
    return FolderService(
        folder_repo=folder_repo,
        set_repo=set_repo,
        flashcard_repo=flashcard_repo,
    )


def get_set_service(
    set_repo: Annotated[ISetRepository, Depends(get_set_repository)],
    folder_repo: Annotated[IFolderRepository, Depends(get_folder_repository)],
    flashcard_repo: Annotated[IFlashcardRepository, Depends(get_flashcard_repository)],
) -> SetService:
    """Return SetService instance."""
    return SetService(
        set_repo=set_repo,
        folder_repo=folder_repo,
        flashcard_repo=flashcard_repo,
    )


def get_flashcard_service(
    flashcard_repo: Annotated[IFlashcardRepository, Depends(get_flashcard_repository)],
    set_repo: Annotated[ISetRepository, Depends(get_set_repository)],
) -> FlashcardService:
    """Return FlashcardService instance."""
    return FlashcardService(
        flashcard_repo=flashcard_repo,
        set_repo=set_repo,
    )


def get_seed_service(
    folder_service: Annotated[FolderService, Depends(get_folder_service)],
    set_service: Annotated[SetService, Depends(get_set_service)],
    flashcard_service: Annotated[FlashcardService, Depends(get_flashcard_service)],
    folder_repo: Annotated[IFolderRepository, Depends(get_folder_repository)],
    set_repo: Annotated[ISetRepository, Depends(get_set_repository)],
    flashcard_repo: Annotated[IFlashcardRepository, Depends(get_flashcard_repository)],
) -> SeedService:
    """Return SeedService instance configured with active repositories and services."""
    return SeedService(
        folder_service=folder_service,
        set_service=set_service,
        flashcard_service=flashcard_service,
        folder_repo=folder_repo,
        set_repo=set_repo,
        flashcard_repo=flashcard_repo,
    )


async def get_current_user_id(
    x_user_id: Annotated[str | None, Header(alias="X-User-ID")] = None,
) -> str:
    """Extract authenticated user ID from header, with fallback to dev default."""
    if x_user_id and x_user_id.strip():
        return x_user_id.strip()
    return settings.default_user_id
