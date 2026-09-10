import asyncio
import json
import logging
from collections.abc import AsyncGenerator
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.dependencies import (
    get_ai_generation_service,
    get_current_user_id,
    get_gdrive_token,
    get_set_service,
)
from app.models.ai_generation import AIGenerationRequest
from app.models.set import FlashcardSet
from app.services.set_service import SetService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["ai_generation"])


@router.post(
    "/generate/stream",
    summary="Stream AI flashcard generation with live LangGraph progress updates",
)
async def generate_flashcards_stream(
    payload: AIGenerationRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
    token: Annotated[str | None, Depends(get_gdrive_token)],
    ai_service: Annotated[Any, Depends(get_ai_generation_service)],
) -> StreamingResponse:
    """Streams Server-Sent Events (SSE) detailing multi-agent LangGraph generation stages."""

    async def event_generator() -> AsyncGenerator[str, None]:
        event_queue: asyncio.Queue[Any] = asyncio.Queue()

        async def worker() -> None:
            try:
                async for event in ai_service.generate_flashcard_set_stream(
                    request=payload,
                    user_id=user_id,
                    token=token,
                ):
                    await event_queue.put(event)
                await event_queue.put(None)
            except Exception as exc:  # noqa: BLE001
                logger.exception("AI generation stream worker encountered error: %s", exc)
                await event_queue.put(exc)

        worker_task = asyncio.create_task(worker())

        try:
            while True:
                try:
                    # Emit keepalive heartbeat ping every 5 seconds if no new event has arrived
                    item = await asyncio.wait_for(event_queue.get(), timeout=5.0)
                    if item is None:
                        break
                    if isinstance(item, Exception):
                        err_json = json.dumps(
                            {
                                "stage": "error",
                                "progress": 0,
                                "message": f"Generation failed: {item!s}",
                                "error": str(item),
                                "cardCount": 0,
                            }
                        )
                        yield f"data: {err_json}\n\n"
                        break

                    json_str = json.dumps(item.model_dump(by_alias=True))
                    yield f"data: {json_str}\n\n"
                except asyncio.TimeoutError:
                    # Send standard SSE keepalive comment line to keep proxy and browser connections alive
                    yield ": keepalive\n\n"
        finally:
            if not worker_task.done():
                worker_task.cancel()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post(
    "/generate",
    response_model=FlashcardSet,
    status_code=status.HTTP_201_CREATED,
    summary="Generate AI Flashcard Set synchronously",
)
async def generate_flashcards_sync(
    payload: AIGenerationRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
    token: Annotated[str | None, Depends(get_gdrive_token)],
    ai_service: Annotated[Any, Depends(get_ai_generation_service)],
    set_service: Annotated[SetService, Depends(get_set_service)],
) -> FlashcardSet:
    """Runs the LangGraph workflow and returns the created FlashcardSet."""
    created_set_id: str | None = None
    last_error: str | None = None

    async for event in ai_service.generate_flashcard_set_stream(
        request=payload,
        user_id=user_id,
        token=token,
    ):
        if event.stage == "completed" and event.set_id:
            created_set_id = event.set_id
        elif event.stage == "error":
            last_error = event.error or event.message

    if not created_set_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI flashcard generation failed: {last_error or 'Unknown error'}",
        )

    set_obj = await set_service.get_set(created_set_id, user_id)
    return set_obj
