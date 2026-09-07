"""Developer environment endpoints for seed population and resetting test data."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.config import settings
from app.dependencies import get_current_user_id, get_seed_service
from app.services.seed_service import SeedService

router = APIRouter(prefix="/api/v1/dev", tags=["Developer Mode"])


class SeedResponse(BaseModel):
    """Response returned after seeding developer test data."""

    status: str = "success"
    message: str
    user_id: str
    folders_created: int
    sets_created: int
    cards_created: int


class ResetResponse(BaseModel):
    """Response returned after resetting developer test data."""

    status: str = "success"
    message: str
    user_id: str
    deleted_folders: int
    deleted_sets: int
    deleted_cards: int


class DevStatusResponse(BaseModel):
    """Response describing developer mode configuration."""

    environment: str
    storage_backend: str
    default_user_id: str
    auto_seed_dev_data: bool
    dev_endpoints_enabled: bool


def _verify_dev_mode_allowed() -> None:
    """Ensure developer utility endpoints are never accessible in production."""
    if settings.environment.lower() == "production" and settings.storage_backend != "memory":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Developer utility endpoints are disabled in production environments.",
        )


@router.get(
    "/status",
    response_model=DevStatusResponse,
    summary="Check developer mode status",
)
async def get_dev_status() -> DevStatusResponse:
    """Return status information for developer mode and seed configurations."""
    return DevStatusResponse(
        environment=settings.environment,
        storage_backend=settings.storage_backend,
        default_user_id=settings.default_user_id,
        auto_seed_dev_data=settings.auto_seed_dev_data,
        dev_endpoints_enabled=(
            settings.environment.lower() != "production" or settings.storage_backend == "memory"
        ),
    )


@router.post(
    "/seed",
    response_model=SeedResponse,
    status_code=status.HTTP_200_OK,
    summary="Seed sample folders, sets, and flashcards",
)
async def seed_data(
    seed_service: Annotated[SeedService, Depends(get_seed_service)],
    user_id: Annotated[str, Depends(get_current_user_id)],
    clear_existing: bool = Query(
        default=True,
        description="Whether to clear existing user folders and sets before seeding.",
    ),
) -> SeedResponse:
    """Populate realistic sample folders, subfolders, sets, and flashcards for developer testing."""
    _verify_dev_mode_allowed()
    stats = await seed_service.seed_user_data(user_id=user_id, clear_existing=clear_existing)
    return SeedResponse(
        message="Developer environment seeded successfully with demo data.",
        user_id=user_id,
        folders_created=stats["folders_created"],
        sets_created=stats["sets_created"],
        cards_created=stats["cards_created"],
    )


@router.post(
    "/reset",
    response_model=ResetResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset and clear user data",
)
async def reset_data(
    seed_service: Annotated[SeedService, Depends(get_seed_service)],
    user_id: Annotated[str, Depends(get_current_user_id)],
) -> ResetResponse:
    """Clear all folders, sets, and flashcards for the current user."""
    _verify_dev_mode_allowed()
    stats = await seed_service.clear_user_data(user_id=user_id)
    return ResetResponse(
        message="Developer environment user data cleared successfully.",
        user_id=user_id,
        deleted_folders=stats["deleted_folders"],
        deleted_sets=stats["deleted_sets"],
        deleted_cards=stats["deleted_cards"],
    )
