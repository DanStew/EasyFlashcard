"""Vertex AI client factory and invocation helpers for Gemini 3.7 / 2.5 Flash."""

import logging
from typing import Any, TypeVar

from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def get_vertex_llm(
    temperature: float = 0.2,
    max_output_tokens: int = 8192,
) -> Any:
    """Instantiates a Vertex AI Gemini ChatModel with configured settings."""
    try:
        from langchain_google_vertexai import ChatVertexAI

        project_id = settings.effective_vertex_project_id
        if not project_id:
            logger.warning("No Vertex project ID configured. Using local dev fallback.")
            return None

        return ChatVertexAI(
            model_name=settings.gemini_model_name,
            project=project_id,
            location=settings.vertex_location,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            max_retries=2,
        )

    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Could not initialize Vertex AI client (%s). Local dev fallback will be utilized if needed.",
            exc,
        )
        return None
