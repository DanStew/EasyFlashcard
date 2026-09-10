"""FastAPI dependencies for dependency injection across routers."""

from typing import Annotated, Any

from fastapi import Depends, Header

from app.config import settings
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
from app.services.flashcard_service import FlashcardService
from app.services.folder_service import FolderService
from app.services.gdrive_service import GoogleDriveService
from app.services.seed_service import SeedService
from app.services.set_service import SetService

# Global repository singletons for in-memory mode
_in_memory_folder_repo = InMemoryFolderRepository()
_in_memory_set_repo = InMemorySetRepository()
_in_memory_flashcard_repo = InMemoryFlashcardRepository()
_in_memory_document_repo = InMemoryDocumentRepository()
_in_memory_user_integration_repo = InMemoryUserIntegrationRepository()


def get_document_repository() -> IDocumentRepository:
    """Return configured Document repository."""
    if settings.storage_backend == "firestore":
        from google.cloud import firestore

        db = firestore.AsyncClient(
            project=settings.firebase_project_id,
            database=settings.firestore_database,
        )
        return FirestoreDocumentRepository(db)
    return _in_memory_document_repo


def get_folder_repository() -> IFolderRepository:
    """Return configured Folder repository."""
    if settings.storage_backend == "firestore":
        from google.cloud import firestore

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

        db = firestore.AsyncClient(
            project=settings.firebase_project_id,
            database=settings.firestore_database,
        )
        return FirestoreFlashcardRepository(db)
def get_user_integration_repository() -> IUserIntegrationRepository:
    """Return configured UserIntegration repository."""
    if settings.storage_backend == "firestore":
        from google.cloud import firestore

        db = firestore.AsyncClient(
            project=settings.firebase_project_id,
            database=settings.firestore_database,
        )
        return FirestoreUserIntegrationRepository(db)
    return _in_memory_user_integration_repo


def get_gdrive_service(
    doc_repo: Annotated[IDocumentRepository, Depends(get_document_repository)],
    user_integration_repo: Annotated[
        IUserIntegrationRepository, Depends(get_user_integration_repository)
    ],
) -> GoogleDriveService:
    """Return GoogleDriveService singleton/instance with integration repo."""
    return GoogleDriveService(
        document_repo=doc_repo,
        user_integration_repo=user_integration_repo,
    )



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


def get_ai_generation_service(
    set_repo: Annotated[ISetRepository, Depends(get_set_repository)],
    flashcard_repo: Annotated[IFlashcardRepository, Depends(get_flashcard_repository)],
    doc_repo: Annotated[IDocumentRepository, Depends(get_document_repository)],
    gdrive_service: Annotated[GoogleDriveService, Depends(get_gdrive_service)],
) -> Any:
    """Return AIGenerationGraphService instance."""
    from app.services.ai.graph_service import AIGenerationGraphService

    return AIGenerationGraphService(
        set_repo=set_repo,
        flashcard_repo=flashcard_repo,
        doc_repo=doc_repo,
        gdrive_service=gdrive_service,
    )


async def get_current_user_id(
    x_user_id: Annotated[str | None, Header(alias="X-User-ID")] = None,
) -> str:
    """Extract authenticated user ID from header, with fallback to dev default."""
    if x_user_id and x_user_id.strip():
        return x_user_id.strip()
    return settings.default_user_id


async def get_gdrive_token(
    x_gdrive_token: Annotated[str | None, Header(alias="X-Google-Drive-Token")] = None,
) -> str | None:
    """Extract Google Drive OAuth access token from header."""
    if x_gdrive_token and x_gdrive_token.strip():
        return x_gdrive_token.strip()
    return None

