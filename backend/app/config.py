import os
import pathlib
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure valid local path for GOOGLE_APPLICATION_CREDENTIALS when running on host machine
cred_env = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
if not cred_env or not os.path.exists(cred_env):
    local_sa = pathlib.Path(__file__).resolve().parent.parent / "service-account.json"
    if local_sa.exists():
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(local_sa)


class Settings(BaseSettings):
    """Global configuration settings for EasyFlashcard backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "EasyFlashcard API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = False

    # CORS configuration
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "capacitor://localhost",
        "ionic://localhost",
        "*",
    ]

    # Storage backend: "memory" or "firestore"
    storage_backend: Literal["memory", "firestore"] = "memory"
    firebase_project_id: str | None = None
    firestore_database: str = "(default)"

    # Default fallback user ID for dev / testing mode before full auth tokens are attached
    default_user_id: str = "dev_user_123"

    # Prepopulate in-memory developer mode environment with demo folders, sets, and cards
    auto_seed_dev_data: bool = True

    # Vertex AI Configuration
    vertex_project_id: str | None = None
    vertex_location: str = "us-central1"
    gemini_model_name: str = "gemini-3.7-flash"
    max_review_iterations: int = 2

    # Google OAuth 2.0 Client Credentials (supports OAUTH_CLIENT_ID / GOOGLE_CLIENT_ID)
    oauth_client_id: str | None = None
    oauth_client_secret: str | None = None
    google_client_id: str | None = None
    google_client_secret: str | None = None

    @property
    def effective_vertex_project_id(self) -> str | None:
        """Resolve Vertex AI Project ID from vertex_project_id or fallback to firebase_project_id."""
        return self.vertex_project_id or self.firebase_project_id

    @property
    def effective_google_client_id(self) -> str | None:
        """Resolve Google OAuth client ID from either oauth_client_id or google_client_id."""
        return self.oauth_client_id or self.google_client_id

    @property
    def effective_google_client_secret(self) -> str | None:
        """Resolve Google OAuth client secret from either oauth_client_secret or google_client_secret."""
        return self.oauth_client_secret or self.google_client_secret


settings = Settings()


