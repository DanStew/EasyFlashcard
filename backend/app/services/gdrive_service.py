"""Google Drive integration service for EasyFlashcard AI Flashcard Studio with persistent OAuth refresh tokens."""

import asyncio
import json
import logging
from datetime import timedelta
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.config import settings
from app.models.common import generate_uuid, utc_now
from app.models.document import (
    Document,
    DriveBreadcrumb,
    DriveFolderContentsResponse,
    DriveFolderItem,
)
from app.models.user_integration import (
    DriveAuthStatusResponse,
    UserIntegration,
)
from app.repositories.base import IDocumentRepository, IUserIntegrationRepository

logger = logging.getLogger(__name__)


class DriveAuthError(HTTPException):
    """Raised when the user's Google Drive OAuth token is missing, invalid, or expired."""

    def __init__(
        self,
        detail: str = "Google Drive authorization expired or missing. Please reconnect Google Drive.",
    ) -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "DRIVE_AUTH_REQUIRED", "message": detail},
        )


class DrivePermissionError(HTTPException):
    """Raised when Google Workspace admin blocks Drive API or scopes are denied."""

    def __init__(
        self,
        detail: str = "Google Drive access was blocked by your organization's security policy or insufficient permissions.",
    ) -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "DRIVE_PERMISSION_DENIED", "message": detail},
        )


class DriveQuotaError(HTTPException):
    """Raised when the user's Google Drive storage quota is exceeded."""

    def __init__(self, detail: str = "Your Google Drive storage is full. Please free up space.") -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "DRIVE_QUOTA_EXCEEDED", "message": detail},
        )


class DriveNotFoundError(HTTPException):
    """Raised when a specified folder or file is not found in Google Drive."""

    def __init__(self, detail: str = "The requested file or folder was not found in Google Drive.") -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DRIVE_ITEM_NOT_FOUND", "message": detail},
        )


class GoogleDriveService:
    """Service for interacting with Google Drive API v3 with persistent OAuth token management."""

    APP_ROOT_FOLDER_NAME = "EasyFlashcard"
    DEFAULT_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive"
    DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"
    DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3"
    GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_OAUTH_REVOKE_URL = "https://oauth2.googleapis.com/revoke"

    def __init__(
        self,
        document_repo: IDocumentRepository,
        user_integration_repo: IUserIntegrationRepository,
    ) -> None:
        self.doc_repo = document_repo
        self.integration_repo = user_integration_repo
        # In-memory mock storage for dev mode / testing without live OAuth token
        self._mock_folders: dict[str, dict[str, Any]] = {}
        self._mock_lock = asyncio.Lock()

    def _is_mock_token(self, token: str | None) -> bool:
        """Check if token string represents a local development mock token."""
        if not token:
            return False
        return (
            token.startswith("mock")
            or token.startswith("dev_")
            or token == "demo_token"
        )

    async def _init_mock_env(self, user_id: str) -> str:
        """Initialize mock EasyFlashcard root folder and sample subfolders for local testing."""
        root_id = f"mock_root_{user_id}"
        async with self._mock_lock:
            if root_id not in self._mock_folders:
                self._mock_folders[root_id] = {
                    "id": root_id,
                    "name": self.APP_ROOT_FOLDER_NAME,
                    "parent_id": None,
                    "user_id": user_id,
                    "created_at": utc_now(),
                }
                # Pre-populate sample subfolders
                bio_id = f"mock_bio_{user_id}"
                cs_id = f"mock_cs_{user_id}"
                self._mock_folders[bio_id] = {
                    "id": bio_id,
                    "name": "Biology 101",
                    "parent_id": root_id,
                    "user_id": user_id,
                    "created_at": utc_now(),
                }
                self._mock_folders[cs_id] = {
                    "id": cs_id,
                    "name": "Computer Science",
                    "parent_id": root_id,
                    "user_id": user_id,
                    "created_at": utc_now(),
                }
                # Seed a mock document in Bio folder
                existing_docs = await self.doc_repo.list_by_drive_folder(bio_id, user_id)
                if not existing_docs:
                    await self.doc_repo.create(
                        Document(
                            id=generate_uuid(),
                            user_id=user_id,
                            name="Lecture_04_Cell_Membrane.pdf",
                            mime_type="application/pdf",
                            drive_file_id=f"mock_file_bio_{user_id}",
                            drive_folder_id=bio_id,
                            web_view_link="https://drive.google.com/file/d/sample/view",
                            size_bytes=2450000,
                            page_count=24,
                            linked_set_ids=[],
                        )
                    )
        return root_id

    # --------------------------------------------------------------------------
    # OAuth Token Management & Refresh Flow
    # --------------------------------------------------------------------------

    async def exchange_auth_code(
        self, code: str, user_id: str, redirect_uri: str = "postmessage"
    ) -> UserIntegration:
        """
        Exchanges Google OAuth authorization code for persistent access and refresh tokens.
        Stores the tokens securely in the user integration repository.
        """
        client_id = settings.effective_google_client_id
        client_secret = settings.effective_google_client_secret

        # Dev / Mock Mode fallback if credentials are omitted or mock code is given
        if self._is_mock_token(code) or not client_id or not client_secret:
            logger.info("Operating in mock OAuth mode for user %s", user_id)
            integration = UserIntegration(
                user_id=user_id,
                provider="google_drive",
                access_token=f"mock_token_{user_id}",
                refresh_token=f"mock_refresh_{user_id}",
                token_type="Bearer",
                expires_at=utc_now() + timedelta(days=365),
                scope=self.DEFAULT_DRIVE_SCOPE,
                is_connected=True,
                updated_at=utc_now(),
            )
            return await self.integration_repo.save(integration)

        payload = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                res = await client.post(self.GOOGLE_OAUTH_TOKEN_URL, data=payload)
            except Exception as exc:
                logger.error("Failed to reach Google OAuth token endpoint: %s", exc)
                raise DriveAuthError(f"Network error connecting to Google Auth: {exc!s}") from exc

            if res.status_code != 200:
                err_text = res.text
                try:
                    err_json = res.json()
                    err_text = err_json.get("error_description") or err_json.get("error") or err_text
                except Exception:
                    pass
                logger.error("OAuth token exchange failed (%s): %s", res.status_code, err_text)
                raise DriveAuthError(f"Failed to authenticate with Google: {err_text}")

            data = res.json()
            access_token = data.get("access_token")
            if not access_token:
                raise DriveAuthError("Google token response did not contain an access_token.")

            expires_in = int(data.get("expires_in", 3600))
            refresh_token = data.get("refresh_token")
            scope = data.get("scope", self.DEFAULT_DRIVE_SCOPE)

            # Retain existing refresh token if Google did not reissue one
            if not refresh_token:
                existing = await self.integration_repo.get(user_id, "google_drive")
                if existing and existing.refresh_token:
                    refresh_token = existing.refresh_token

            integration = UserIntegration(
                user_id=user_id,
                provider="google_drive",
                access_token=access_token,
                refresh_token=refresh_token,
                token_type=data.get("token_type", "Bearer"),
                expires_at=utc_now() + timedelta(seconds=expires_in),
                scope=scope,
                is_connected=True,
                updated_at=utc_now(),
            )
            saved = await self.integration_repo.save(integration)
            logger.info("Successfully linked Google Drive for user %s (has_refresh=%s, scope=%s)", user_id, bool(refresh_token), scope)
            return saved

    async def _refresh_google_token(self, refresh_token: str) -> dict[str, Any]:
        """Exchanges refresh token with Google for a new short-lived access token."""
        client_id = settings.effective_google_client_id
        client_secret = settings.effective_google_client_secret

        if not client_id or not client_secret:
            return {
                "access_token": f"mock_refreshed_{utc_now().timestamp()}",
                "expires_in": 3600,
            }

        payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(self.GOOGLE_OAUTH_TOKEN_URL, data=payload)
            if res.status_code != 200:
                logger.error("Token refresh failed with status %d: %s", res.status_code, res.text)
                raise DriveAuthError(f"Could not refresh Google token: {res.text}")
            return res.json()

    async def resolve_access_token(self, user_id: str, token_override: str | None = None) -> str:
        """
        Resolves a fresh, valid Google Drive access token for the user.
        Automatically uses refresh_token to silently obtain a new access_token if expired.
        """
        # 1. If explicit mock token is supplied, use mock mode directly
        if token_override and self._is_mock_token(token_override):
            return token_override

        # 2. Check repository for stored user integration
        integration = await self.integration_repo.get(user_id, "google_drive")

        if not integration or not integration.is_connected:
            # If a live token override was explicitly passed in request header, use it
            if token_override and token_override.strip():
                return token_override.strip()
            # If no OAuth credentials configured in dev environment, fallback to mock mode
            if not settings.effective_google_client_id or not settings.effective_google_client_secret:
                return f"mock_{user_id}"
            raise DriveAuthError("Google Drive is not connected. Please connect your Google Drive account.")

        # 3. If access token exists and is valid for at least 60 more seconds, use it
        now = utc_now()
        if integration.access_token and integration.expires_at and integration.expires_at > (now + timedelta(seconds=60)):
            return integration.access_token

        # 4. If expired or nearing expiration, and refresh_token exists, silently refresh
        if integration.refresh_token:
            try:
                refreshed = await self._refresh_google_token(integration.refresh_token)
                integration.access_token = refreshed["access_token"]
                expires_in = int(refreshed.get("expires_in", 3600))
                integration.expires_at = utc_now() + timedelta(seconds=expires_in)
                if refreshed.get("refresh_token"):
                    integration.refresh_token = refreshed["refresh_token"]
                integration.updated_at = utc_now()
                await self.integration_repo.save(integration)
                logger.info("Silently refreshed Google Drive token for user %s", user_id)
                return integration.access_token
            except Exception as exc:
                logger.warning("Failed to refresh token for user %s: %s", user_id, exc)
                # Fallback to header token if supplied
                if token_override and token_override.strip():
                    return token_override.strip()
                raise DriveAuthError("Google Drive authorization expired. Please reconnect Google Drive.") from exc

        # 5. If no refresh token but we have an access token, try returning it
        if integration.access_token:
            return integration.access_token

        if token_override and token_override.strip():
            return token_override.strip()

        raise DriveAuthError("Google Drive authorization missing. Please reconnect Google Drive.")

    async def _inspect_token_info(self, token: str) -> dict[str, Any] | None:
        """Inspects tokeninfo from Google OAuth endpoint to check actual granted scopes."""
        if self._is_mock_token(token):
            return None
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(f"https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={token}")
                if res.status_code == 200:
                    return res.json()
        except Exception as exc:
            logger.debug("Failed to inspect token info: %s", exc)
        return None

    async def get_auth_status(self, user_id: str, token: str | None = None) -> DriveAuthStatusResponse:
        """Returns the current Google Drive connection and token status for the user."""
        integration = await self.integration_repo.get(user_id, "google_drive")
        if integration and integration.is_connected:
            scope_str = integration.scope or ""
            has_full_scope = "https://www.googleapis.com/auth/drive" in scope_str.split() or (
                "auth/drive" in scope_str and "auth/drive.file" not in scope_str.replace("https://www.googleapis.com/auth/drive", "").strip()
            )
            needs_upgrade = not has_full_scope and "auth/drive.file" in scope_str

            return DriveAuthStatusResponse(
                connected=True,
                has_refresh_token=bool(integration.refresh_token),
                expires_at=integration.expires_at,
                scope=integration.scope,
                needs_scope_upgrade=needs_upgrade,
            )

        # If a token is provided in request header (e.g. from Firebase client login)
        if token and token.strip():
            info = await self._inspect_token_info(token.strip())
            if info:
                scope_str = info.get("scope", "")
                has_full_scope = "https://www.googleapis.com/auth/drive" in scope_str.split()
                needs_upgrade = not has_full_scope
                return DriveAuthStatusResponse(
                    connected=True,
                    has_refresh_token=False,
                    email=info.get("email"),
                    scope=scope_str,
                    needs_scope_upgrade=needs_upgrade,
                )

        # In dev mode without configured credentials, return mock connected state
        if not settings.effective_google_client_id:
            return DriveAuthStatusResponse(
                connected=True,
                has_refresh_token=True,
                expires_at=utc_now() + timedelta(days=365),
                scope=self.DEFAULT_DRIVE_SCOPE,
                needs_scope_upgrade=False,
            )

        return DriveAuthStatusResponse(connected=False, has_refresh_token=False, needs_scope_upgrade=False)

    async def disconnect(self, user_id: str) -> bool:
        """Disconnects the Google Drive integration and revokes tokens if possible."""
        integration = await self.integration_repo.get(user_id, "google_drive")
        if integration and integration.access_token and not self._is_mock_token(integration.access_token):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.post(self.GOOGLE_OAUTH_REVOKE_URL, params={"token": integration.access_token})
            except Exception as exc:
                logger.warning("Token revocation request failed: %s", exc)

        return await self.integration_repo.delete(user_id, "google_drive")

    # --------------------------------------------------------------------------
    # Google Drive Core File & Folder Operations
    # --------------------------------------------------------------------------

    async def get_or_create_app_root_folder(self, user_id: str, token: str | None = None) -> str:
        """Finds or creates the root 'EasyFlashcard' folder in the user's Google Drive."""
        active_token = await self.resolve_access_token(user_id, token)

        if self._is_mock_token(active_token):
            return await self._init_mock_env(user_id)

        headers = {"Authorization": f"Bearer {active_token}"}
        async with httpx.AsyncClient(timeout=15.0) as client:
            query = (
                f"name = '{self.APP_ROOT_FOLDER_NAME}' and "
                "mimeType = 'application/vnd.google-apps.folder' and "
                "trashed = false"
            )
            drive_search_params = {
                "q": query,
                "fields": "files(id, name, parents, createdTime)",
                "spaces": "drive",
                "supportsAllDrives": "true",
                "includeItemsFromAllDrives": "true",
                "pageSize": "10",
            }
            try:
                res = await client.get(
                    f"{self.DRIVE_API_BASE}/files",
                    headers=headers,
                    params=drive_search_params,
                )
            except Exception as exc:
                raise DriveAuthError(f"Failed to connect to Google Drive API: {exc!s}") from exc

            if res.status_code == 401:
                # Try one force-refresh if possible
                forced_token = await self._force_refresh_token(user_id)
                headers["Authorization"] = f"Bearer {forced_token}"
                res = await client.get(
                    f"{self.DRIVE_API_BASE}/files",
                    headers=headers,
                    params=drive_search_params,
                )
                if res.status_code == 401:
                    raise DriveAuthError()

            if res.status_code == 403:
                self._handle_403_error(res)
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail="Google Drive API error")

            files = res.json().get("files", [])
            if files:
                # Prefer folder whose parent is root if multiple exist
                root_parents = [f for f in files if "root" in f.get("parents", [])]
                if root_parents:
                    return str(root_parents[0]["id"])
                return str(files[0]["id"])

            # Create the EasyFlashcard root folder if it doesn't exist
            create_payload = {
                "name": self.APP_ROOT_FOLDER_NAME,
                "mimeType": "application/vnd.google-apps.folder",
                "parents": ["root"],
            }
            create_res = await client.post(
                f"{self.DRIVE_API_BASE}/files",
                headers=headers,
                json=create_payload,
            )
            if create_res.status_code not in (200, 201):
                raise HTTPException(
                    status_code=create_res.status_code,
                    detail="Failed to create root EasyFlashcard folder in Google Drive",
                )
            return str(create_res.json()["id"])

    async def list_folder_contents(
        self, folder_id: str | None, user_id: str, token: str | None = None
    ) -> DriveFolderContentsResponse:
        """Lists subfolders and document files inside a folder, along with breadcrumb trail and bidirectional reconciliation."""
        active_token = await self.resolve_access_token(user_id, token)
        root_id = await self.get_or_create_app_root_folder(user_id, active_token)
        current_id = folder_id if folder_id else root_id

        if self._is_mock_token(active_token):
            async with self._mock_lock:
                current_raw = self._mock_folders.get(current_id)
                if not current_raw:
                    current_raw = self._mock_folders.get(root_id, {
                        "id": root_id,
                        "name": self.APP_ROOT_FOLDER_NAME,
                        "parent_id": None,
                    })
                    current_id = root_id

                current_folder = DriveFolderItem(
                    id=current_raw["id"],
                    name=current_raw["name"],
                    parent_id=current_raw.get("parent_id"),
                )

                subfolders = [
                    DriveFolderItem(
                        id=f["id"],
                        name=f["name"],
                        parent_id=f.get("parent_id"),
                    )
                    for f in self._mock_folders.values()
                    if f.get("parent_id") == current_id and f.get("user_id") == user_id
                ]

            files = await self.doc_repo.list_by_drive_folder(current_id, user_id)
            breadcrumbs = await self._build_mock_breadcrumbs(current_id, root_id, user_id)
            return DriveFolderContentsResponse(
                current_folder=current_folder,
                breadcrumbs=breadcrumbs,
                subfolders=subfolders,
                files=files,
            )

        headers = {"Authorization": f"Bearer {active_token}"}
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Get current folder metadata
            curr_res = await client.get(
                f"{self.DRIVE_API_BASE}/files/{current_id}",
                headers=headers,
                params={"fields": "id, name, parents, mimeType", "supportsAllDrives": "true"},
            )
            if curr_res.status_code == 401:
                forced_token = await self._force_refresh_token(user_id)
                headers["Authorization"] = f"Bearer {forced_token}"
                curr_res = await client.get(
                    f"{self.DRIVE_API_BASE}/files/{current_id}",
                    headers=headers,
                    params={"fields": "id, name, parents, mimeType", "supportsAllDrives": "true"},
                )
                if curr_res.status_code == 401:
                    raise DriveAuthError()

            if curr_res.status_code == 403:
                self._handle_403_error(curr_res)
            if curr_res.status_code == 404:
                raise DriveNotFoundError()

            curr_data = curr_res.json()
            parent_id = curr_data.get("parents", [None])[0]
            current_folder = DriveFolderItem(
                id=curr_data["id"],
                name=curr_data["name"],
                parent_id=parent_id,
                mime_type=curr_data.get("mimeType", "application/vnd.google-apps.folder"),
            )

            # Query direct child subfolders
            query_folders = (
                f"'{current_id}' in parents and "
                "mimeType = 'application/vnd.google-apps.folder' and "
                "trashed = false"
            )
            f_res = await client.get(
                f"{self.DRIVE_API_BASE}/files",
                headers=headers,
                params={
                    "q": query_folders,
                    "fields": "files(id, name, parents, modifiedTime, createdTime)",
                    "pageSize": "100",
                    "spaces": "drive",
                    "supportsAllDrives": "true",
                    "includeItemsFromAllDrives": "true",
                },
            )
            raw_subfolders = f_res.json().get("files", []) if f_res.status_code == 200 else []
            subfolders = [
                DriveFolderItem(
                    id=sf["id"],
                    name=sf["name"],
                    parent_id=current_id,
                    mime_type="application/vnd.google-apps.folder",
                    created_at=sf.get("createdTime"),
                    updated_at=sf.get("modifiedTime"),
                )
                for sf in raw_subfolders
            ]

            # Query direct child non-folder files in Google Drive
            query_files = (
                f"'{current_id}' in parents and "
                "mimeType != 'application/vnd.google-apps.folder' and "
                "trashed = false"
            )
            files_res = await client.get(
                f"{self.DRIVE_API_BASE}/files",
                headers=headers,
                params={
                    "q": query_files,
                    "fields": "files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, iconLink, size, createdTime, modifiedTime)",
                    "pageSize": "100",
                    "spaces": "drive",
                    "supportsAllDrives": "true",
                    "includeItemsFromAllDrives": "true",
                },
            )
            drive_files = files_res.json().get("files", []) if files_res.status_code == 200 else []

            # Reconcile external Drive files with doc repository
            drive_file_ids = {str(df["id"]) for df in drive_files}

            # Prune docs in doc_repo that belonged to this folder but no longer exist in Drive
            existing_folder_docs = await self.doc_repo.list_by_drive_folder(current_id, user_id)
            for old_doc in existing_folder_docs:
                if old_doc.drive_file_id and old_doc.drive_file_id not in drive_file_ids:
                    await self.doc_repo.delete(old_doc.id, user_id)

            reconciled_files: list[Document] = []
            for df in drive_files:
                df_id = str(df["id"])
                existing_doc = await self.doc_repo.get_by_drive_file_id(df_id, user_id)
                size_bytes = int(df["size"]) if "size" in df and df["size"] is not None else None

                if existing_doc:
                    needs_update = False
                    if existing_doc.drive_folder_id != current_id:
                        existing_doc.drive_folder_id = current_id
                        needs_update = True
                    if existing_doc.name != df.get("name", existing_doc.name):
                        existing_doc.name = df.get("name", existing_doc.name)
                        needs_update = True
                    if df.get("webViewLink") and existing_doc.web_view_link != df.get("webViewLink"):
                        existing_doc.web_view_link = df.get("webViewLink")
                        needs_update = True
                    if df.get("webContentLink") and existing_doc.web_content_link != df.get("webContentLink"):
                        existing_doc.web_content_link = df.get("webContentLink")
                        needs_update = True
                    if df.get("thumbnailLink") and existing_doc.thumbnail_link != df.get("thumbnailLink"):
                        existing_doc.thumbnail_link = df.get("thumbnailLink")
                        needs_update = True
                    if df.get("iconLink") and existing_doc.icon_link != df.get("iconLink"):
                        existing_doc.icon_link = df.get("iconLink")
                        needs_update = True
                    if size_bytes is not None and existing_doc.size_bytes != size_bytes:
                        existing_doc.size_bytes = size_bytes
                        needs_update = True
                    if needs_update:
                        existing_doc = await self.doc_repo.update(existing_doc)
                    reconciled_files.append(existing_doc)
                else:
                    new_doc = Document(
                        id=generate_uuid(),
                        user_id=user_id,
                        name=df.get("name", "Untitled Document"),
                        mime_type=df.get("mimeType", "application/octet-stream"),
                        drive_file_id=df_id,
                        drive_folder_id=current_id,
                        web_view_link=df.get("webViewLink"),
                        web_content_link=df.get("webContentLink"),
                        thumbnail_link=df.get("thumbnailLink"),
                        icon_link=df.get("iconLink"),
                        size_bytes=size_bytes,
                        linked_set_ids=[],
                        created_at=utc_now(),
                        updated_at=utc_now(),
                    )
                    created_doc = await self.doc_repo.create(new_doc)
                    reconciled_files.append(created_doc)

            breadcrumbs = await self._build_drive_breadcrumbs(current_id, root_id, headers, client)

            return DriveFolderContentsResponse(
                current_folder=current_folder,
                breadcrumbs=breadcrumbs,
                subfolders=subfolders,
                files=reconciled_files,
            )

    async def download_file_bytes(
        self, drive_file_id: str, user_id: str, token: str | None = None
    ) -> bytes:
        """Downloads raw binary file bytes from Google Drive for AI synthesis or document preview."""
        active_token = await self.resolve_access_token(user_id, token)

        if self._is_mock_token(active_token):
            return b"Sample study notes content for testing document extraction."

        headers = {"Authorization": f"Bearer {active_token}"}
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.get(
                f"{self.DRIVE_API_BASE}/files/{drive_file_id}?alt=media",
                headers=headers,
            )
            if res.status_code == 401:
                forced_token = await self._force_refresh_token(user_id)
                headers["Authorization"] = f"Bearer {forced_token}"
                res = await client.get(
                    f"{self.DRIVE_API_BASE}/files/{drive_file_id}?alt=media",
                    headers=headers,
                )
                if res.status_code == 401:
                    raise DriveAuthError()

            if res.status_code == 403:
                self._handle_403_error(res)
            if res.status_code == 404:
                raise DriveNotFoundError()
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail="Failed to download file from Google Drive")

            return res.content

    async def create_subfolder(
        self, name: str, parent_id: str | None, user_id: str, token: str | None = None
    ) -> DriveFolderItem:
        """Creates a new subfolder in Google Drive under the specified parent (or root)."""
        active_token = await self.resolve_access_token(user_id, token)
        root_id = await self.get_or_create_app_root_folder(user_id, active_token)
        target_parent = parent_id if parent_id else root_id

        if self._is_mock_token(active_token):
            new_id = f"mock_folder_{generate_uuid()}"
            async with self._mock_lock:
                self._mock_folders[new_id] = {
                    "id": new_id,
                    "name": name.strip(),
                    "parent_id": target_parent,
                    "user_id": user_id,
                    "created_at": utc_now(),
                }
            return DriveFolderItem(
                id=new_id,
                name=name.strip(),
                parent_id=target_parent,
            )

        headers = {"Authorization": f"Bearer {active_token}"}
        payload = {
            "name": name.strip(),
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [target_parent],
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                f"{self.DRIVE_API_BASE}/files",
                headers=headers,
                json=payload,
            )
            if res.status_code == 401:
                forced_token = await self._force_refresh_token(user_id)
                headers["Authorization"] = f"Bearer {forced_token}"
                res = await client.post(f"{self.DRIVE_API_BASE}/files", headers=headers, json=payload)
                if res.status_code == 401:
                    raise DriveAuthError()

            if res.status_code == 403:
                self._handle_403_error(res)
            if res.status_code not in (200, 201):
                raise HTTPException(status_code=res.status_code, detail="Failed to create Google Drive folder")
            data = res.json()
            return DriveFolderItem(
                id=data["id"],
                name=data["name"],
                parent_id=target_parent,
            )

    async def upload_document(
        self,
        file_bytes: bytes,
        filename: str,
        mime_type: str,
        parent_id: str | None,
        user_id: str,
        token: str | None = None,
    ) -> Document:
        """Uploads a document file to Google Drive and persists metadata in Firestore/Repository."""
        active_token = await self.resolve_access_token(user_id, token)
        root_id = await self.get_or_create_app_root_folder(user_id, active_token)
        target_parent = parent_id if parent_id else root_id

        drive_file_id = f"mock_doc_{generate_uuid()}"
        web_view_link = "https://drive.google.com/file/d/preview"
        thumbnail_link = None
        size_bytes = len(file_bytes)

        if not self._is_mock_token(active_token):
            metadata = {
                "name": filename,
                "parents": [target_parent],
            }
            boundary = "-------314159265358979323846"
            delimiter = f"\r\n--{boundary}\r\n"
            close_delim = f"\r\n--{boundary}--"

            body = (
                delimiter.encode("utf-8")
                + b"Content-Type: application/json; charset=UTF-8\r\n\r\n"
                + json.dumps(metadata).encode("utf-8")
                + delimiter.encode("utf-8")
                + f"Content-Type: {mime_type}\r\n\r\n".encode()
                + file_bytes
                + close_delim.encode("utf-8")
            )
            upload_headers = {
                "Authorization": f"Bearer {active_token}",
                "Content-Type": f"multipart/related; boundary={boundary}",
            }
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(
                    f"{self.DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink,size",
                    headers=upload_headers,
                    content=body,
                )
                if res.status_code == 401:
                    forced_token = await self._force_refresh_token(user_id)
                    upload_headers["Authorization"] = f"Bearer {forced_token}"
                    res = await client.post(
                        f"{self.DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink,size",
                        headers=upload_headers,
                        content=body,
                    )
                    if res.status_code == 401:
                        raise DriveAuthError()

                if res.status_code == 403:
                    self._handle_403_error(res)
                if res.status_code not in (200, 201):
                    raise HTTPException(status_code=res.status_code, detail="Google Drive file upload failed")
                data = res.json()
                drive_file_id = data["id"]
                web_view_link = data.get("webViewLink")
                thumbnail_link = data.get("thumbnailLink")

        doc = Document(
            id=generate_uuid(),
            user_id=user_id,
            name=filename,
            mime_type=mime_type,
            drive_file_id=drive_file_id,
            drive_folder_id=target_parent,
            web_view_link=web_view_link,
            thumbnail_link=thumbnail_link,
            size_bytes=size_bytes,
            page_count=None,
            linked_set_ids=[],
        )
        return await self.doc_repo.create(doc)

    async def move_item(
        self,
        item_id: str,
        target_folder_id: str,
        source_folder_id: str | None,
        user_id: str,
        token: str | None = None,
    ) -> bool:
        """Moves a file or folder into another destination folder in Google Drive."""
        active_token = await self.resolve_access_token(user_id, token)

        if self._is_mock_token(active_token):
            async with self._mock_lock:
                if item_id in self._mock_folders:
                    self._mock_folders[item_id]["parent_id"] = target_folder_id
                    return True
            doc = await self.doc_repo.get_by_id(item_id, user_id)
            if doc:
                doc.drive_folder_id = target_folder_id
                await self.doc_repo.update(doc)
                return True
            return False

        headers = {"Authorization": f"Bearer {active_token}"}
        params: dict[str, str] = {"addParents": target_folder_id}
        if source_folder_id:
            params["removeParents"] = source_folder_id

        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.patch(
                f"{self.DRIVE_API_BASE}/files/{item_id}",
                headers=headers,
                params=params,
            )
            if res.status_code == 401:
                forced_token = await self._force_refresh_token(user_id)
                headers["Authorization"] = f"Bearer {forced_token}"
                res = await client.patch(
                    f"{self.DRIVE_API_BASE}/files/{item_id}",
                    headers=headers,
                    params=params,
                )
                if res.status_code == 401:
                    raise DriveAuthError()

            if res.status_code == 403:
                self._handle_403_error(res)
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail="Failed to move item in Google Drive")

            doc = await self.doc_repo.get_by_drive_file_id(item_id, user_id)
            if doc:
                doc.drive_folder_id = target_folder_id
                await self.doc_repo.update(doc)
            return True

    async def trash_item(self, item_id: str, user_id: str, token: str | None = None) -> bool:
        """Moves a file or folder to the user's Google Drive Trash."""
        active_token = await self.resolve_access_token(user_id, token)

        if self._is_mock_token(active_token):
            async with self._mock_lock:
                if item_id in self._mock_folders:
                    del self._mock_folders[item_id]
                    return True
            await self.doc_repo.delete(item_id, user_id)
            return True

        headers = {"Authorization": f"Bearer {active_token}"}
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.patch(
                f"{self.DRIVE_API_BASE}/files/{item_id}",
                headers=headers,
                json={"trashed": True},
            )
            if res.status_code == 401:
                forced_token = await self._force_refresh_token(user_id)
                headers["Authorization"] = f"Bearer {forced_token}"
                res = await client.patch(
                    f"{self.DRIVE_API_BASE}/files/{item_id}",
                    headers=headers,
                    json={"trashed": True},
                )
                if res.status_code == 401:
                    raise DriveAuthError()

            if res.status_code == 403:
                self._handle_403_error(res)
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail="Failed to trash Google Drive item")

            await self.doc_repo.delete_by_drive_file_id(item_id, user_id)
            return True

    async def download_file_bytes(
        self,
        drive_file_id: str,
        user_id: str,
        token: str | None = None,
        mime_type: str | None = None,
    ) -> tuple[bytes, str]:
        """
        Downloads raw binary content for a file from Google Drive.
        If the file is a Google Workspace Document (Doc, Slide, Sheet), exports it as PDF.
        Returns a tuple of (file_bytes, effective_mime_type).
        """
        active_token = await self.resolve_access_token(user_id, token)

        if self._is_mock_token(active_token):
            return b"Mock file content for testing in local environment.", "text/plain"

        headers = {"Authorization": f"Bearer {active_token}"}

        async with httpx.AsyncClient(timeout=45.0) as client:
            effective_mime = mime_type
            if not effective_mime:
                meta_res = await client.get(
                    f"{self.DRIVE_API_BASE}/files/{drive_file_id}",
                    headers=headers,
                    params={"fields": "id, name, mimeType"},
                )
                if meta_res.status_code == 200:
                    effective_mime = meta_res.json().get("mimeType")

            if effective_mime in (
                "application/vnd.google-apps.presentation",
                "application/vnd.google-apps.document",
                "application/vnd.google-apps.drawing",
            ):
                res = await client.get(
                    f"{self.DRIVE_API_BASE}/files/{drive_file_id}/export",
                    headers=headers,
                    params={"mimeType": "application/pdf"},
                )
                effective_mime = "application/pdf"
            elif effective_mime == "application/vnd.google-apps.spreadsheet":
                res = await client.get(
                    f"{self.DRIVE_API_BASE}/files/{drive_file_id}/export",
                    headers=headers,
                    params={"mimeType": "text/csv"},
                )
                effective_mime = "text/csv"
            else:
                res = await client.get(
                    f"{self.DRIVE_API_BASE}/files/{drive_file_id}?alt=media",
                    headers=headers,
                )

            if res.status_code == 401:
                forced_token = await self._force_refresh_token(user_id)
                headers["Authorization"] = f"Bearer {forced_token}"
                if effective_mime == "application/pdf" and mime_type and "google-apps" in mime_type:
                    res = await client.get(
                        f"{self.DRIVE_API_BASE}/files/{drive_file_id}/export",
                        headers=headers,
                        params={"mimeType": "application/pdf"},
                    )
                else:
                    res = await client.get(
                        f"{self.DRIVE_API_BASE}/files/{drive_file_id}?alt=media",
                        headers=headers,
                    )
                if res.status_code == 401:
                    raise DriveAuthError()

            if res.status_code == 403:
                self._handle_403_error(res)
            if res.status_code == 404:
                raise DriveNotFoundError()
            if res.status_code != 200:
                raise HTTPException(
                    status_code=res.status_code,
                    detail=f"Failed to download file from Google Drive: {res.text}",
                )

            return res.content, effective_mime or "application/octet-stream"

    async def _force_refresh_token(self, user_id: str) -> str:
        """Forces an immediate OAuth refresh using stored refresh token."""
        integration = await self.integration_repo.get(user_id, "google_drive")
        if not integration or not integration.refresh_token:
            raise DriveAuthError("No refresh token available. Please reconnect Google Drive.")
        refreshed = await self._refresh_google_token(integration.refresh_token)
        integration.access_token = refreshed["access_token"]
        expires_in = int(refreshed.get("expires_in", 3600))
        integration.expires_at = utc_now() + timedelta(seconds=expires_in)
        if refreshed.get("refresh_token"):
            integration.refresh_token = refreshed["refresh_token"]
        integration.updated_at = utc_now()
        await self.integration_repo.save(integration)
        return integration.access_token

    def _handle_403_error(self, res: httpx.Response) -> None:
        """Inspects 403 response details and raises informative domain exceptions."""
        try:
            body = res.json()
            errors = body.get("error", {}).get("errors", [])
            for err in errors:
                reason = err.get("reason", "")
                if reason in ("storageQuotaExceeded", "quotaExceeded"):
                    raise DriveQuotaError()
                if reason in ("insufficientPermissions", "adminPolicyEnforced", "accessNotConfigured"):
                    raise DrivePermissionError(
                        detail=err.get("message")
                        or "Google Drive access blocked by organization administrator policy."
                    )
        except (ValueError, KeyError):
            pass
        raise DrivePermissionError()

    async def _build_mock_breadcrumbs(
        self, current_id: str, root_id: str, user_id: str
    ) -> list[DriveBreadcrumb]:
        """Build breadcrumbs for mock folders."""
        crumbs: list[DriveBreadcrumb] = []
        curr = current_id
        visited = set()
        while curr and curr not in visited:
            visited.add(curr)
            raw = self._mock_folders.get(curr)
            if not raw:
                break
            crumbs.insert(0, DriveBreadcrumb(id=raw["id"], name=raw["name"]))
            if curr == root_id:
                break
            curr = raw.get("parent_id") or ""
        return crumbs

    async def _build_drive_breadcrumbs(
        self, current_id: str, root_id: str, headers: dict[str, str], client: httpx.AsyncClient
    ) -> list[DriveBreadcrumb]:
        """Walks parents up to root to produce ordered breadcrumbs."""
        crumbs: list[DriveBreadcrumb] = []
        curr = current_id
        visited = set()
        while curr and curr not in visited:
            visited.add(curr)
            try:
                res = await client.get(
                    f"{self.DRIVE_API_BASE}/files/{curr}",
                    headers=headers,
                    params={"fields": "id, name, parents"},
                )
                if res.status_code != 200:
                    break
                data = res.json()
                crumbs.insert(0, DriveBreadcrumb(id=data["id"], name=data["name"]))
                if curr == root_id:
                    break
                parents = data.get("parents", [])
                curr = parents[0] if parents else ""
            except Exception:  # noqa: BLE001
                break
        return crumbs
