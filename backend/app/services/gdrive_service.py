"""Google Drive integration service for EasyFlashcard AI Flashcard Studio."""

import asyncio
from datetime import datetime
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.models.common import generate_uuid, utc_now
from app.models.document import (
    Document,
    DriveBreadcrumb,
    DriveFolderContentsResponse,
    DriveFolderItem,
)
from app.repositories.base import IDocumentRepository


class DriveAuthError(HTTPException):
    """Raised when the user's Google Drive OAuth token is missing, invalid, or expired."""

    def __init__(self, detail: str = "Google Drive authorization expired or missing. Please reconnect Google Drive.") -> None:
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
    """Service for interacting with Google Drive API v3 scoped to the EasyFlashcard folder hierarchy."""

    APP_ROOT_FOLDER_NAME = "EasyFlashcard"
    DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"
    DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3"

    def __init__(self, document_repo: IDocumentRepository) -> None:
        self.doc_repo = document_repo
        # In-memory mock storage for dev mode / testing without live OAuth token
        self._mock_folders: dict[str, dict[str, Any]] = {}
        self._mock_lock = asyncio.Lock()

    def _is_mock_token(self, token: str | None) -> bool:
        """Check if request is in local development mock mode."""
        return not token or token.startswith("dev_") or token == "mock" or token == "demo_token"

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

    async def get_or_create_app_root_folder(self, user_id: str, token: str | None) -> str:
        """Finds or creates the root 'EasyFlashcard' folder in the user's Google Drive."""
        if self._is_mock_token(token):
            return await self._init_mock_env(user_id)

        headers = {"Authorization": f"Bearer {token}"}
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Query for existing EasyFlashcard root folder
            query = (
                f"name = '{self.APP_ROOT_FOLDER_NAME}' and "
                "mimeType = 'application/vnd.google-apps.folder' and "
                "trashed = false"
            )
            try:
                res = await client.get(
                    f"{self.DRIVE_API_BASE}/files",
                    headers=headers,
                    params={"q": query, "fields": "files(id, name)"},
                )
            except Exception as exc:
                raise DriveAuthError(f"Failed to connect to Google Drive API: {str(exc)}") from exc

            if res.status_code == 401:
                raise DriveAuthError()
            if res.status_code == 403:
                self._handle_403_error(res)
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail="Google Drive API error")

            files = res.json().get("files", [])
            if files:
                return str(files[0]["id"])

            # Create the EasyFlashcard root folder if it doesn't exist
            create_payload = {
                "name": self.APP_ROOT_FOLDER_NAME,
                "mimeType": "application/vnd.google-apps.folder",
            }
            create_res = await client.post(
                f"{self.DRIVE_API_BASE}/files",
                headers=headers,
                json=create_payload,
            )
            if create_res.status_code != 200:
                raise HTTPException(
                    status_code=create_res.status_code,
                    detail="Failed to create root EasyFlashcard folder in Google Drive",
                )
            return str(create_res.json()["id"])

    async def list_folder_contents(
        self, folder_id: str | None, user_id: str, token: str | None
    ) -> DriveFolderContentsResponse:
        """Lists subfolders and document files inside a folder, along with breadcrumb trail."""
        root_id = await self.get_or_create_app_root_folder(user_id, token)
        current_id = folder_id if folder_id else root_id

        if self._is_mock_token(token):
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

        headers = {"Authorization": f"Bearer {token}"}
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Get current folder metadata
            curr_res = await client.get(
                f"{self.DRIVE_API_BASE}/files/{current_id}",
                headers=headers,
                params={"fields": "id, name, parents, mimeType"},
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
                params={"q": query_folders, "fields": "files(id, name, parents, modifiedTime)"},
            )
            raw_subfolders = f_res.json().get("files", []) if f_res.status_code == 200 else []
            subfolders = [
                DriveFolderItem(
                    id=sf["id"],
                    name=sf["name"],
                    parent_id=current_id,
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
                },
            )
            drive_files = files_res.json().get("files", []) if files_res.status_code == 200 else []

            # Reconcile external Drive files with doc repository
            reconciled_files: list[Document] = []
            for df in drive_files:
                df_id = str(df["id"])
                existing_doc = await self.doc_repo.get_by_drive_file_id(df_id, user_id)
                size_bytes = int(df["size"]) if "size" in df and df["size"] is not None else None

                if existing_doc:
                    # Update folder location or name if changed externally
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
                    if needs_update:
                        existing_doc = await self.doc_repo.update(existing_doc)
                    reconciled_files.append(existing_doc)
                else:
                    # File was created/dropped externally in Google Drive - auto-index as Document
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

    async def create_subfolder(
        self, name: str, parent_id: str | None, user_id: str, token: str | None
    ) -> DriveFolderItem:
        """Creates a new subfolder in Google Drive under the specified parent (or root)."""
        root_id = await self.get_or_create_app_root_folder(user_id, token)
        target_parent = parent_id if parent_id else root_id

        if self._is_mock_token(token):
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

        headers = {"Authorization": f"Bearer {token}"}
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
        token: str | None,
    ) -> Document:
        """Uploads a document file to Google Drive and persists metadata in Firestore/Repository."""
        root_id = await self.get_or_create_app_root_folder(user_id, token)
        target_parent = parent_id if parent_id else root_id

        drive_file_id = f"mock_doc_{generate_uuid()}"
        web_view_link = "https://drive.google.com/file/d/preview"
        thumbnail_link = None
        size_bytes = len(file_bytes)

        if not self._is_mock_token(token):
            headers = {"Authorization": f"Bearer {token}"}
            # Step 1: Initiate multipart upload to Google Drive
            metadata = {
                "name": filename,
                "parents": [target_parent],
            }
            boundary = "-------314159265358979323846"
            delimiter = f"\r\n--{boundary}\r\n"
            close_delim = f"\r\n--{boundary}--"

            import json
            body = (
                delimiter.encode("utf-8")
                + b"Content-Type: application/json; charset=UTF-8\r\n\r\n"
                + json.dumps(metadata).encode("utf-8")
                + delimiter.encode("utf-8")
                + f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8")
                + file_bytes
                + close_delim.encode("utf-8")
            )
            upload_headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": f"multipart/related; boundary={boundary}",
            }
            async with httpx.AsyncClient(timeout=60.0) as client:
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
        token: str | None,
    ) -> bool:
        """Moves a file or folder into another destination folder in Google Drive."""
        if self._is_mock_token(token):
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

        headers = {"Authorization": f"Bearer {token}"}
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
                raise DriveAuthError()
            if res.status_code == 403:
                self._handle_403_error(res)
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail="Failed to move item in Google Drive")

            # Update document record in DB if it is a document
            doc = await self.doc_repo.get_by_drive_file_id(item_id, user_id)
            if doc:
                doc.drive_folder_id = target_folder_id
                await self.doc_repo.update(doc)
            return True

    async def trash_item(self, item_id: str, user_id: str, token: str | None) -> bool:
        """Moves a file or folder to the user's Google Drive Trash."""
        if self._is_mock_token(token):
            async with self._mock_lock:
                if item_id in self._mock_folders:
                    del self._mock_folders[item_id]
                    return True
            await self.doc_repo.delete(item_id, user_id)
            return True

        headers = {"Authorization": f"Bearer {token}"}
        async with httpx.AsyncClient(timeout=15.0) as client:
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
            except Exception:
                break
        return crumbs
