"""Pydantic data models for OAuth user integrations and Google Drive token exchange."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.common import utc_now


class UserIntegration(BaseModel):
    """Represents a persisted third-party integration credential record for a user."""

    user_id: str
    provider: str = "google_drive"
    access_token: str
    refresh_token: str | None = None
    token_type: str = "Bearer"
    expires_at: datetime | None = None
    scope: str | None = None
    is_connected: bool = True
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class DriveAuthExchangeRequest(BaseModel):
    """Payload for exchanging OAuth authorization code for persistent tokens."""

    code: str
    redirect_uri: str = "postmessage"


class DriveAuthStatusResponse(BaseModel):
    """Response representing current Google Drive connection status."""

    connected: bool
    has_refresh_token: bool
    expires_at: datetime | None = None
    email: str | None = None
    scope: str | None = None
    needs_scope_upgrade: bool = False


class DriveAuthDisconnectResponse(BaseModel):
    """Response returned upon disconnecting Google Drive."""

    success: bool
    message: str


class GoogleTokenResponse(BaseModel):
    """Raw response schema from Google OAuth 2.0 token endpoint."""

    access_token: str
    expires_in: int
    refresh_token: str | None = None
    scope: str | None = None
    token_type: str = "Bearer"
    id_token: str | None = None
    extra: dict[str, Any] = Field(default_factory=dict)
