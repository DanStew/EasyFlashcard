"""Document extraction and multimodal payload formatting for strict AI grounding."""

import base64
import io
from typing import Any

from pypdf import PdfReader


class MultimodalDocument:
    """Represents a source document formatted as a native multimodal payload for Vertex AI / Gemini."""

    def __init__(
        self,
        document_id: str,
        document_name: str,
        mime_type: str,
        raw_bytes: bytes | None = None,
        text_content: str | None = None,
    ) -> None:
        self.document_id = document_id
        self.document_name = document_name
        self.mime_type = mime_type
        self.raw_bytes = raw_bytes
        self.text_content = text_content
        self._b64_cache: str | None = None

    @property
    def is_binary_media(self) -> bool:
        """True if document should be passed as media (PDF, image, audio, video)."""
        return self.raw_bytes is not None and (
            self.mime_type.startswith("image/")
            or self.mime_type == "application/pdf"
            or self.mime_type.startswith("audio/")
            or self.mime_type.startswith("video/")
        )

    @property
    def base64_data(self) -> str | None:
        """Returns base64 encoded string of raw_bytes."""
        if not self.raw_bytes:
            return None
        if self._b64_cache is None:
            self._b64_cache = base64.b64encode(self.raw_bytes).decode("utf-8")
        return self._b64_cache

    def to_media_part(self) -> dict[str, Any] | None:
        """Returns a LangChain media part dictionary if binary media."""
        if self.is_binary_media and self.base64_data:
            return {
                "type": "media",
                "mime_type": self.mime_type,
                "data": self.base64_data,
            }
        return None

    def to_text_part(self) -> dict[str, Any]:
        """Returns a text representation with document headers."""
        if self.text_content:
            text = self.text_content
        elif self.raw_bytes:
            text = self.raw_bytes.decode("utf-8", errors="ignore")
        else:
            text = f"Document: {self.document_name}"

        return {
            "type": "text",
            "text": f"--- [Document: '{self.document_name}'] ---\n{text}\n",
        }


def create_multimodal_document(
    document_id: str,
    document_name: str,
    raw_bytes: bytes,
    mime_type: str,
) -> MultimodalDocument:
    """Factory helper to construct a MultimodalDocument from binary or text bytes."""
    # Normalize mime types
    lower_name = document_name.lower()
    norm_mime = mime_type.lower() if mime_type else "application/octet-stream"
    if lower_name.endswith(".pdf"):
        norm_mime = "application/pdf"
    elif lower_name.endswith(".jpg") or lower_name.endswith(".jpeg"):
        norm_mime = "image/jpeg"
    elif lower_name.endswith(".png"):
        norm_mime = "image/png"
    elif lower_name.endswith(".webp"):
        norm_mime = "image/webp"
    elif lower_name.endswith(".md") or lower_name.endswith(".markdown"):
        norm_mime = "text/markdown"
    elif lower_name.endswith(".txt") or lower_name.endswith(".csv"):
        norm_mime = "text/plain"
    elif lower_name.endswith(".json"):
        norm_mime = "application/json"

    text_content = None
    if norm_mime.startswith("text/") or norm_mime == "application/json":
        text_content = raw_bytes.decode("utf-8", errors="ignore")

    return MultimodalDocument(
        document_id=document_id,
        document_name=document_name,
        mime_type=norm_mime,
        raw_bytes=raw_bytes,
        text_content=text_content,
    )


def create_text_document(
    document_id: str,
    document_name: str,
    raw_text: str,
    mime_type: str = "text/markdown",
) -> MultimodalDocument:
    """Factory helper to construct a MultimodalDocument from plain text or markdown notes."""
    return MultimodalDocument(
        document_id=document_id,
        document_name=document_name,
        mime_type=mime_type,
        raw_bytes=raw_text.encode("utf-8"),
        text_content=raw_text,
    )


def build_multimodal_human_message_parts(
    documents: list[MultimodalDocument],
    prompt_text: str,
) -> list[dict[str, Any]]:
    """
    Builds a list of LangChain multimodal message parts containing:
    1. Media parts for attached PDFs and images.
    2. Text parts for attached text documents.
    3. The instruction prompt text part.
    """
    parts: list[dict[str, Any]] = []

    for doc in documents:
        media_part = doc.to_media_part()
        if media_part is not None:
            parts.append(media_part)
        else:
            parts.append(doc.to_text_part())

    parts.append({
        "type": "text",
        "text": prompt_text,
    })

    return parts


class ExtractedDocument:
    """Represents an extracted document with structured page-level text."""

    def __init__(
        self,
        document_id: str,
        document_name: str,
        pages: list[dict[str, Any]],
        total_text: str,
    ) -> None:
        self.document_id = document_id
        self.document_name = document_name
        self.pages = pages
        self.total_text = total_text


def extract_text_from_pdf_bytes(
    pdf_bytes: bytes, document_id: str, document_name: str
) -> ExtractedDocument:
    """Extracts text page-by-page from PDF binary data if text stream exists."""
    pages: list[dict[str, Any]] = []
    formatted_chunks: list[str] = []

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for idx, page in enumerate(reader.pages):
            page_num = idx + 1
            text = (page.extract_text() or "").strip()
            pages.append({"page_number": page_num, "text": text})
            header = f"--- [Document: '{document_name}' | Slide/Page {page_num}] ---"
            formatted_chunks.append(f"{header}\n{text}\n")
    except Exception:
        pass

    combined_text = "\n".join(formatted_chunks)
    return ExtractedDocument(
        document_id=document_id,
        document_name=document_name,
        pages=pages,
        total_text=combined_text,
    )


def extract_from_raw_text(
    raw_text: str, document_id: str = "raw_notes", document_name: str = "Pasted Notes"
) -> ExtractedDocument:
    """Wraps raw text or pasted markdown with default page attribution."""
    pages = [{"page_number": 1, "text": raw_text.strip()}]
    header = f"--- [Document: '{document_name}' | Section 1] ---"
    combined_text = f"{header}\n{raw_text.strip()}\n"

    return ExtractedDocument(
        document_id=document_id,
        document_name=document_name,
        pages=pages,
        total_text=combined_text,
    )
