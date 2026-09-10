"""LangGraph State Machine assembly and streaming orchestration service for AI Flashcard generation with native multimodal document ingestion."""

import logging
from collections.abc import AsyncGenerator
from typing import Any

from langgraph.graph import END, StateGraph

from app.models.ai_generation import (
    AIGenerationEvent,
    AIGenerationRequest,
    GeneratedCardItem,
)
from app.models.flashcard import (
    CardFace,
    DocumentReference,
    Flashcard,
)
from app.models.set import FlashcardSet
from app.repositories.base import IDocumentRepository, IFlashcardRepository, ISetRepository
from app.services.ai.document_extractor import (
    MultimodalDocument,
    create_multimodal_document,
    create_text_document,
)
from app.services.ai.graph_nodes import (
    GraphState,
    fill_gaps_node,
    generate_cards_batch_node,
    plan_curriculum_node,
    review_cards_node,
    should_continue_review,
)
from app.services.gdrive_service import GoogleDriveService

logger = logging.getLogger(__name__)


class AIGenerationGraphService:
    """Service orchestrating the LangGraph multi-agent flashcard synthesis workflow with native multimodal input."""

    def __init__(
        self,
        set_repo: ISetRepository,
        flashcard_repo: IFlashcardRepository,
        doc_repo: IDocumentRepository,
        gdrive_service: GoogleDriveService,
    ) -> None:
        self.set_repo = set_repo
        self.flashcard_repo = flashcard_repo
        self.doc_repo = doc_repo
        self.gdrive_service = gdrive_service

    def build_graph(self) -> Any:
        """Constructs and compiles the StateGraph workflow."""
        workflow = StateGraph(GraphState)

        # Add graph nodes
        workflow.add_node("planner", plan_curriculum_node)
        workflow.add_node("generator", generate_cards_batch_node)
        workflow.add_node("reviewer", review_cards_node)
        workflow.add_node("refiner", fill_gaps_node)

        # Persistence node closure
        async def persist_node(state: GraphState) -> dict[str, Any]:
            return await self._persist_final_set(state)

        workflow.add_node("persist", persist_node)

        # Define graph edges
        workflow.set_entry_point("planner")
        workflow.add_edge("planner", "generator")
        workflow.add_edge("generator", "reviewer")

        # Conditional review loop
        workflow.add_conditional_edges(
            "reviewer",
            should_continue_review,
            {
                "fill_gaps": "refiner",
                "persist_set": "persist",
            },
        )
        workflow.add_edge("refiner", "reviewer")
        workflow.add_edge("persist", END)

        return workflow.compile()

    async def _prepare_source_context(
        self,
        request: AIGenerationRequest,
        user_id: str,
        token: str | None,
    ) -> tuple[list[MultimodalDocument], str, list[dict[str, Any]]]:
        """Loads and formats native multimodal document payloads and context chunks."""
        multimodal_docs: list[MultimodalDocument] = []
        context_chunks: list[str] = []
        grounded_docs_meta: list[dict[str, Any]] = []

        # 1. Process explicit document IDs if provided
        for doc_id in request.document_ids:
            doc = await self.doc_repo.get_by_id(doc_id, user_id)
            if not doc:
                # Try finding by drive_file_id
                doc = await self.doc_repo.get_by_drive_file_id(doc_id, user_id)

            if doc:
                grounded_docs_meta.append({"id": doc.id, "name": doc.name})
                try:
                    if doc.drive_file_id:
                        file_bytes, effective_mime = await self.gdrive_service.download_file_bytes(
                            drive_file_id=doc.drive_file_id,
                            user_id=user_id,
                            token=token,
                            mime_type=doc.mime_type,
                        )
                        multi_doc = create_multimodal_document(
                            document_id=doc.id,
                            document_name=doc.name,
                            raw_bytes=file_bytes,
                            mime_type=effective_mime,
                        )
                        multimodal_docs.append(multi_doc)
                        context_chunks.append(f"Document attached: '{doc.name}' (MIME: {effective_mime}, Size: {len(file_bytes)} bytes)")
                    else:
                        multi_doc = create_text_document(
                            document_id=doc.id,
                            document_name=doc.name,
                            raw_text=f"Study Notes for {doc.name}",
                        )
                        multimodal_docs.append(multi_doc)
                        context_chunks.append(f"Document attached: '{doc.name}'")
                except Exception as exc:  # noqa: BLE001
                    logger.warning("Could not download document bytes for %s: %s", doc.id, exc)
                    multi_doc = create_text_document(
                        document_id=doc.id,
                        document_name=doc.name,
                        raw_text=f"Study Guide for {doc.name}",
                    )
                    multimodal_docs.append(multi_doc)
                    context_chunks.append(f"Document attached: '{doc.name}'")

        # 2. Process raw text / pasted notes
        if request.raw_text and request.raw_text.strip():
            raw_doc = create_text_document(
                document_id="pasted_notes",
                document_name="Lecture Notes",
                raw_text=request.raw_text.strip(),
            )
            multimodal_docs.append(raw_doc)
            context_chunks.append(f"Pasted Notes:\n{request.raw_text.strip()[:500]}...")
            grounded_docs_meta.append({"id": "pasted_notes", "name": "Lecture Notes"})

        combined_context = "\n\n".join(context_chunks)
        return multimodal_docs, combined_context, grounded_docs_meta

    async def _persist_final_set(self, state: GraphState) -> dict[str, Any]:
        """Persists the generated cards and creates a new FlashcardSet in the requested folder."""
        user_id = state.get("user_id", "dev_user_123")
        folder_id = state.get("folder_id")
        set_name = state.get("final_set_name") or state.get("set_name") or "AI Generated Study Set"
        set_desc = state.get("set_description") or "AI Synthesized Flashcard Set"
        cards_raw = state.get("generated_cards", [])
        grounded_docs = state.get("grounded_docs_metadata", [])

        logger.info(
            "Persisting set '%s' with %d flashcards into folder_id '%s'...",
            set_name,
            len(cards_raw),
            folder_id,
        )

        # Deduplicate cards
        seen_fronts: set[str] = set()
        unique_cards: list[GeneratedCardItem] = []
        for c in cards_raw:
            cleaned = c.front.strip().lower()
            if cleaned not in seen_fronts:
                seen_fronts.add(cleaned)
                unique_cards.append(c)

        # Collect source document IDs
        source_doc_ids = [d["id"] for d in grounded_docs if d["id"] != "pasted_notes"]

        # 1. Create the FlashcardSet
        set_obj = FlashcardSet(
            user_id=user_id,
            folder_id=folder_id,
            name=set_name,
            description=set_desc,
            card_count=len(unique_cards),
            tags=["AI Generated", "Vertex AI", "Multimodal Grounded"],
            source_document_ids=source_doc_ids,
        )
        created_set = await self.set_repo.create(set_obj)

        # 2. Batch insert the Flashcards
        flashcards_to_create: list[Flashcard] = []
        for idx, card in enumerate(unique_cards):
            source_ref: DocumentReference | None = None
            if card.document_name:
                source_ref = DocumentReference(
                    document_id=card.document_id or "source_doc",
                    document_name=card.document_name,
                    page_number=card.page_number or 1,
                    grounding_evidence=card.grounding_evidence,
                )

            flashcards_to_create.append(
                Flashcard(
                    set_id=created_set.id,
                    front=CardFace(text=card.front),
                    back=CardFace(text=card.back),
                    order_index=idx,
                    source_reference=source_ref,
                )
            )

        if flashcards_to_create:
            await self.flashcard_repo.create_bulk(flashcards_to_create)

        # 3. Update linkedSetIds on documents
        for doc_id in source_doc_ids:
            doc = await self.doc_repo.get_by_id(doc_id, user_id)
            if doc and created_set.id not in doc.linked_set_ids:
                doc.linked_set_ids.append(created_set.id)
                await self.doc_repo.update(doc)

        return {
            "created_set_id": created_set.id,
            "final_set_name": created_set.name,
            "current_stage": "completed",
            "current_message": f"Successfully created flashcard set '{created_set.name}' with {len(unique_cards)} cards.",
            "progress_percent": 100,
        }

    async def generate_flashcard_set_stream(
        self,
        request: AIGenerationRequest,
        user_id: str,
        token: str | None = None,
    ) -> AsyncGenerator[AIGenerationEvent, None]:
        """Yields Server-Sent Events showing real-time agent progression as the graph executes."""
        yield AIGenerationEvent(
            stage="init",
            progress=5,
            message="Initializing AI Agent studio and preparing documents...",
            card_count=0,
        )

        try:
            multimodal_docs, source_context, grounded_docs = await self._prepare_source_context(
                request=request, user_id=user_id, token=token
            )

            initial_state: GraphState = {
                "user_id": user_id,
                "user_prompt": request.prompt,
                "raw_text": request.raw_text,
                "document_ids": request.document_ids,
                "folder_id": request.folder_id,
                "set_name": request.set_name,
                "set_description": request.set_description,
                "focus_mode": request.focus_mode,
                "source_context": source_context,
                "multimodal_docs": multimodal_docs,
                "grounded_docs_metadata": grounded_docs,
                "curriculum_topics": [],
                "generated_cards": [],
                "iteration_count": 0,
                "is_approved": False,
                "current_stage": "init",
                "current_message": f"Ingesting {len(multimodal_docs)} source document(s) directly into Vertex AI...",
                "progress_percent": 10,
                "created_set_id": None,
                "final_set_name": None,
                "quality_score": 0,
                "error": None,
            }

            compiled_graph = self.build_graph()

            # Stream execution state changes
            async for event in compiled_graph.astream(initial_state):
                for node_name, node_output in event.items():
                    stage = node_output.get("current_stage", "generating")
                    progress = node_output.get("progress_percent", 50)
                    msg = node_output.get("current_message", f"Agent step: {node_name}")
                    cards = node_output.get("generated_cards", [])
                    set_id = node_output.get("created_set_id")
                    set_name = node_output.get("final_set_name")

                    yield AIGenerationEvent(
                        stage=stage,
                        progress=progress,
                        message=msg,
                        card_count=len(cards),
                        set_id=set_id,
                        set_name=set_name,
                    )

        except Exception as exc:
            logger.exception("AI Generation error encountered during LangGraph execution")
            yield AIGenerationEvent(
                stage="error",
                progress=0,
                message=f"Generation failed: {exc!s}",
                error=str(exc),
            )
