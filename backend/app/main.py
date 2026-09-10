import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    ai_generation_router,
    dev_router,
    documents_router,
    flashcards_router,
    folders_router,
    health_router,
    search_router,
    sets_router,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan event handler for backend startup and shutdown tasks."""
    # Prepopulate developer mode environment if configured and storage is in-memory
    if settings.auto_seed_dev_data and settings.storage_backend == "memory":
        try:
            from app.dependencies import (
                _in_memory_flashcard_repo,
                _in_memory_folder_repo,
                _in_memory_set_repo,
            )
            from app.services.flashcard_service import FlashcardService
            from app.services.folder_service import FolderService
            from app.services.seed_service import SeedService
            from app.services.set_service import SetService

            folder_svc = FolderService(
                _in_memory_folder_repo, _in_memory_set_repo, _in_memory_flashcard_repo
            )
            set_svc = SetService(
                _in_memory_set_repo, _in_memory_folder_repo, _in_memory_flashcard_repo
            )
            card_svc = FlashcardService(_in_memory_flashcard_repo, _in_memory_set_repo)

            seed_svc = SeedService(
                folder_service=folder_svc,
                set_service=set_svc,
                flashcard_service=card_svc,
                folder_repo=_in_memory_folder_repo,
                set_repo=_in_memory_set_repo,
                flashcard_repo=_in_memory_flashcard_repo,
            )
            stats = await seed_svc.seed_user_data(settings.default_user_id, clear_existing=False)
            logger.info(
                "Developer environment auto-seeded on startup: %d folders, %d sets, %d cards",
                stats["folders_created"],
                stats["sets_created"],
                stats["cards_created"],
            )
        except Exception as e:  # noqa: BLE001
            logger.warning("Failed to auto-seed developer environment on startup: %s", e)

    yield
    # Shutdown actions (if any)


def create_app() -> FastAPI:
    """Factory function to build and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="FastAPI Backend for EasyFlashcard - Folders, Sets, and Flashcard Management",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API routers
    app.include_router(health_router)
    app.include_router(folders_router)
    app.include_router(sets_router)
    app.include_router(flashcards_router)
    app.include_router(documents_router)
    app.include_router(ai_generation_router)
    app.include_router(search_router)
    app.include_router(dev_router)

    return app


app = create_app()
