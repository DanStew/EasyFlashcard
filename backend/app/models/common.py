"""Shared base models, utility types, and helpers for domain models."""

import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict


def generate_uuid() -> str:
    """Generate a clean UUIDv4 string."""
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(UTC)


def to_camel_case(snake_str: str) -> str:
    """Convert snake_case string to camelCase."""
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


class CamelModel(BaseModel):
    """Base model that automatically converts snake_case Python attributes to camelCase JSON keys."""

    model_config = ConfigDict(
        alias_generator=to_camel_case,
        populate_by_name=True,
        from_attributes=True,
    )


class TimestampMixin(BaseModel):
    """Timestamp mixin providing createdAt and updatedAt fields."""

    created_at: datetime = utc_now()
    updated_at: datetime = utc_now()
