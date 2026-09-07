"""Routers package."""

from app.routers.dev import router as dev_router
from app.routers.flashcards import router as flashcards_router
from app.routers.folders import router as folders_router
from app.routers.health import router as health_router
from app.routers.search import router as search_router
from app.routers.sets import router as sets_router

__all__ = [
    "dev_router",
    "flashcards_router",
    "folders_router",
    "health_router",
    "search_router",
    "sets_router",
]
