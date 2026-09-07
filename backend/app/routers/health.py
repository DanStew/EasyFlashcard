"""Health check router."""

from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=dict[str, str])
@router.get("/api/v1/health", response_model=dict[str, str])
async def health_check() -> dict[str, str]:
    """Health check endpoint to verify backend service status."""
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
        "storage_backend": settings.storage_backend,
    }

