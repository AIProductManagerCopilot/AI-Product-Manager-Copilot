"""
Memory Extractor & Deduplication Engine.

Extracts long-term facts, decisions, preferences, constraints, and tooling choices from
chat conversations using Google GenAI SDK and performs vector similarity deduplication.
"""

import json
import logging
import uuid
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories.memory_repository import MemoryRepository
from app.services.vector_service import VectorService, vector_service

logger = logging.getLogger(__name__)


class ExtractedFact(BaseModel):
    fact: str = Field(
        ...,
        description="Concise, self-contained statement of fact, decision, preference, constraint, or tool.",
    )
    type: str = Field(
        ...,
        description="Memory category: preference, project_fact, decision, constraint, or tooling.",
    )


class ExtractedMemoryList(BaseModel):
    items: List[ExtractedFact] = Field(
        default_factory=list,
        description="List of extracted long-term memory items worth preserving across sessions.",
    )


class MemoryExtractorService:
    """Service to automatically extract and deduplicate long-term memory facts from chat history."""

    def __init__(
        self,
        vec_service: Optional[VectorService] = None,
    ):
        self.vector_service = vec_service or vector_service
        self.ai_client = genai.Client(api_key=settings.gemini_api_key)

    async def extract_and_store_memories(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
        recent_messages: List[Any],
        workspace_id: Optional[uuid.UUID] = None,
        similarity_threshold: float = 0.88,
    ) -> List[Dict[str, Any]]:
        """
        Extracts long-term memories from recent chat messages, performs semantic deduplication
        against existing user memories, and persists non-duplicates to SQL and Qdrant.
        """
        if not recent_messages:
            return []

        formatted_dialogue = []
        for msg in recent_messages:
            role = getattr(msg, "role", None) or (msg.get("role") if isinstance(msg, dict) else "user")
            content = getattr(msg, "content", None) or (msg.get("content") if isinstance(msg, dict) else "")
            if content:
                formatted_dialogue.append(f"{role.upper()}: {content.strip()}")

        conversation_text = "\n".join(formatted_dialogue)
        if not conversation_text.strip():
            return []

        # Step 1: Call Gemini to extract memory candidates
        extracted_candidates = await self._call_llm_extraction(conversation_text)
        if not extracted_candidates:
            return []

        memory_repo = MemoryRepository(db)
        stored_memories = []

        # Step 2: Deduplicate and store candidates
        for item in extracted_candidates:
            fact_text = item.fact.strip()
            fact_type = item.type.strip() if item.type in {"preference", "project_fact", "decision", "constraint", "tooling"} else "project_fact"

            if not fact_text:
                continue

            # Search Qdrant for existing similar memory
            similar_hits = await self.vector_service.search_user_memories(
                user_id=str(user_id),
                query=fact_text,
                workspace_id=str(workspace_id) if workspace_id else None,
                limit=3,
                min_score=similarity_threshold,
            )

            if similar_hits:
                # Duplicate detected! Touch existing memory timestamp
                existing_hit = similar_hits[0]
                existing_memory_id_str = existing_hit.get("memory_id")
                logger.info(
                    "Duplicate memory detected (score=%.3f) for user '%s': '%s' -> updating last_confirmed_at",
                    existing_hit.get("score", 0.0),
                    user_id,
                    fact_text,
                )
                try:
                    existing_uuid = uuid.UUID(existing_memory_id_str)
                    await memory_repo.touch_memory(existing_uuid, user_id)
                except Exception as err:
                    logger.warning("Failed to touch existing memory '%s': %s", existing_memory_id_str, str(err))
                continue

            # Insert new memory into SQL
            db_memory = await memory_repo.create_memory(
                user_id=user_id,
                workspace_id=workspace_id,
                fact=fact_text,
                fact_type=fact_type,
                source_session_id=session_id,
                confidence=1.0,
            )

            # Upsert new memory vector into Qdrant
            await self.vector_service.upsert_memory_point(
                memory_id=str(db_memory.id),
                fact_text=fact_text,
                user_id=str(user_id),
                workspace_id=str(workspace_id) if workspace_id else None,
                fact_type=fact_type,
                superseded=False,
            )

            stored_memories.append(
                {
                    "id": str(db_memory.id),
                    "fact": fact_text,
                    "type": fact_type,
                }
            )

        logger.info("Successfully extracted and stored %d new long-term memories for user '%s'", len(stored_memories), user_id)
        return stored_memories

    async def _call_llm_extraction(self, conversation_text: str) -> List[ExtractedFact]:
        """Calls Gemini API with structured JSON output to extract memory candidates."""
        try:
            model_env = (
                getattr(settings, "gemini_api_model", None)
                or getattr(settings, "gemini_model", None)
                or "gemini-3.6-flash"
            )
            model_target = model_env.replace("models/", "")

            system_prompt = (
                "You are an expert AI Product Manager Copilot memory extraction engine.\n"
                "Analyze the conversation transcript and extract key facts worth remembering across future sessions.\n\n"
                "Extract ONLY:\n"
                "- User preferences (e.g. preferred tech stack, work style, design choices)\n"
                "- Product facts (e.g. core product vision, target audience, key features)\n"
                "- Product decisions (e.g. 'PRD generation is in MVP scope')\n"
                "- Constraints (e.g. budget, deadlines, legacy system requirements)\n"
                "- Tooling/platforms (e.g. 'Team uses Jira and PostgreSQL')\n\n"
                "Do NOT extract greetings, small talk, temporary troubleshooting questions, or one-off chat noise.\n"
                "Format output strictly according to the requested JSON schema."
            )

            response = self.ai_client.models.generate_content(
                model=model_target,
                contents=f"Extract long-term memory items from this conversation transcript:\n\n{conversation_text}",
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    response_schema=ExtractedMemoryList,
                    temperature=0.1,
                ),
            )

            if response.text:
                data = json.loads(response.text)
                if isinstance(data, dict) and "items" in data:
                    return [ExtractedFact(**item) for item in data["items"] if isinstance(item, dict)]
                elif isinstance(data, list):
                    return [ExtractedFact(**item) for item in data if isinstance(item, dict)]

            return []
        except Exception as exc:
            logger.error("Failed to extract memories via LLM: %s", str(exc))
            return []
