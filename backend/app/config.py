"""Application configuration module using pydantic-settings."""

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


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


settings = Settings()
