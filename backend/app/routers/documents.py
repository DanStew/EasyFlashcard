"""Router endpoints for Document Management and Google Drive EasyFlashcard Studio integration."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status

from app.dependencies import (
    get_current_user_id,
    get_document_repository,
    get_gdrive_service,
    get_gdrive_token,
    get_set_repository,
)
from app.models.document import (
    CreateSubfolderRequest,
    Document,
    DriveFolderContentsResponse,
    DriveFolderItem,
    MoveItemRequest,
)
from app.models.user_integration import (
    DriveAuthDisconnectResponse,
    DriveAuthExchangeRequest,
    DriveAuthStatusResponse,
)
from app.repositories.base import IDocumentRepository, ISetRepository
from app.services.gdrive_service import GoogleDriveService

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


@router.post(
    "/drive/auth/exchange",
    response_model=DriveAuthStatusResponse,
    summary="Exchange Google OAuth authorization code for persistent refresh token",
)
async def exchange_drive_auth_code(
    payload: DriveAuthExchangeRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
    gdrive_service: Annotated[GoogleDriveService, Depends(get_gdrive_service)],
) -> DriveAuthStatusResponse:
    """Exchanges one-time OAuth authorization code for persistent offline access & refresh token."""
    await gdrive_service.exchange_auth_code(
        code=payload.code,
        user_id=user_id,
        redirect_uri=payload.redirect_uri,
    )
    return await gdrive_service.get_auth_status(user_id=user_id)


@router.get(
    "/drive/auth/status",
    response_model=DriveAuthStatusResponse,
    summary="Check user Google Drive OAuth connection status",
)
async def get_drive_auth_status(
    user_id: Annotated[str, Depends(get_current_user_id)],
    gdrive_service: Annotated[GoogleDriveService, Depends(get_gdrive_service)],
    token: Annotated[str | None, Depends(get_gdrive_token)] = None,
) -> DriveAuthStatusResponse:
    """Returns whether the authenticated user has an active Google Drive link with persistent refresh token."""
    return await gdrive_service.get_auth_status(user_id=user_id, token=token)


@router.post(
    "/drive/auth/disconnect",
    response_model=DriveAuthDisconnectResponse,
    summary="Disconnect Google Drive and revoke credentials",
)
async def disconnect_drive_integration(
    user_id: Annotated[str, Depends(get_current_user_id)],
    gdrive_service: Annotated[GoogleDriveService, Depends(get_gdrive_service)],
) -> DriveAuthDisconnectResponse:
    """Disconnects Google Drive and clears saved OAuth tokens."""
    success = await gdrive_service.disconnect(user_id=user_id)
    return DriveAuthDisconnectResponse(
        success=success,
        message="Google Drive has been disconnected.",
    )



@router.get(
    "/drive/contents",
    response_model=DriveFolderContentsResponse,
    summary="Get Google Drive folder contents, subfolders, and documents",
)
async def get_drive_folder_contents(
    user_id: Annotated[str, Depends(get_current_user_id)],
    gdrive_service: Annotated[GoogleDriveService, Depends(get_gdrive_service)],
    token: Annotated[str | None, Depends(get_gdrive_token)],
    folder_id: Annotated[
        str | None,
        Query(
            description="Folder ID to view contents of. If omitted, defaults to root EasyFlashcard folder."
        ),
    ] = None,
) -> DriveFolderContentsResponse:
    """Retrieve contents of a specific folder in the user's EasyFlashcard Google Drive directory."""
    return await gdrive_service.list_folder_contents(
        folder_id=folder_id,
        user_id=user_id,
        token=token,
    )


@router.post(
    "/drive/folders",
    response_model=DriveFolderItem,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new subfolder in Google Drive EasyFlashcard hierarchy",
)
async def create_drive_subfolder(
    payload: CreateSubfolderRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
    gdrive_service: Annotated[GoogleDriveService, Depends(get_gdrive_service)],
    token: Annotated[str | None, Depends(get_gdrive_token)],
) -> DriveFolderItem:
    """Creates a new subfolder in the user's Google Drive under parent_folder_id."""
    return await gdrive_service.create_subfolder(
        name=payload.name,
        parent_id=payload.parent_folder_id,
        user_id=user_id,
        token=token,
    )


@router.post(
    "/upload",
    response_model=Document,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a study document directly to Google Drive",
)
async def upload_document_to_drive(
    file: Annotated[UploadFile, File(...)],
    user_id: Annotated[str, Depends(get_current_user_id)],
    gdrive_service: Annotated[GoogleDriveService, Depends(get_gdrive_service)],
    token: Annotated[str | None, Depends(get_gdrive_token)],
    folder_id: Annotated[str | None, Form()] = None,
) -> Document:
    """Uploads a document stream (PDF, Doc, Slide, Image) directly into the specified Drive folder."""
    filename = file.filename or "untitled_document.pdf"
    mime_type = file.content_type or "application/octet-stream"
    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    return await gdrive_service.upload_document(
        file_bytes=file_bytes,
        filename=filename,
        mime_type=mime_type,
        parent_id=folder_id,
        user_id=user_id,
        token=token,
    )


@router.patch(
    "/drive/items/move",
    summary="Move a file or folder within Google Drive hierarchy",
)
async def move_drive_item(
    payload: MoveItemRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
    gdrive_service: Annotated[GoogleDriveService, Depends(get_gdrive_service)],
    token: Annotated[str | None, Depends(get_gdrive_token)],
) -> dict[str, bool]:
    """Moves a file or subfolder to a new destination folder in Google Drive."""
    success = await gdrive_service.move_item(
        item_id=payload.item_id,
        target_folder_id=payload.target_folder_id,
        source_folder_id=payload.source_folder_id,
        user_id=user_id,
        token=token,
    )
    return {"success": success}


@router.delete(
    "/drive/items/{item_id}",
    summary="Move a file or folder to Google Drive trash",
)
async def trash_drive_item(
    item_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)],
    gdrive_service: Annotated[GoogleDriveService, Depends(get_gdrive_service)],
    token: Annotated[str | None, Depends(get_gdrive_token)],
) -> dict[str, bool]:
    """Moves the specified file or subfolder to the user's Google Drive Trash."""
    success = await gdrive_service.trash_item(
        item_id=item_id,
        user_id=user_id,
        token=token,
    )
    return {"success": success}


@router.get(
    "",
    response_model=list[Document],
    summary="List all user documents",
)
async def list_user_documents(
    user_id: Annotated[str, Depends(get_current_user_id)],
    doc_repo: Annotated[IDocumentRepository, Depends(get_document_repository)],
) -> list[Document]:
    """Returns a list of all documents owned by the authenticated user."""
    return await doc_repo.list_by_user(user_id=user_id)


@router.get(
    "/{document_id}",
    response_model=Document,
    summary="Get single document by ID",
)
async def get_document_by_id(
    document_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)],
    doc_repo: Annotated[IDocumentRepository, Depends(get_document_repository)],
    set_repo: Annotated[ISetRepository, Depends(get_set_repository)],
) -> Document:
    """Retrieves document metadata along with linked flashcard sets."""
    doc = await doc_repo.get_by_id(document_id, user_id)
    if not doc:
        # Check if requested by drive file ID
        doc = await doc_repo.get_by_drive_file_id(document_id, user_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    # Resolve linked sets that have this document ID
    user_sets = await set_repo.list_by_user(user_id=user_id)
    linked_set_ids = [
        s.id for s in user_sets if doc.id in s.source_document_ids or doc.drive_file_id in s.source_document_ids
    ]
    doc.linked_set_ids = linked_set_ids
    return doc
