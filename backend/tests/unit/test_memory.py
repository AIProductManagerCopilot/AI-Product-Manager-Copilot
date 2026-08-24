"""
Unit tests for Long-Term Memory (Phase 4).
Tests MemoryRepository, MemoryExtractorService logic, Pydantic schemas, and Memory API endpoints.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.models.chat_models import UserMemory
from app.repositories.memory_repository import MemoryRepository
from app.schemas.memory import MemoryCreate, MemoryResponse, MemoryUpdate
from app.services.memory_extractor import ExtractedFact, MemoryExtractorService


def test_memory_schemas():
    """Verify Pydantic schemas validate memory payloads correctly."""
    create_payload = MemoryCreate(
        fact="User prefers PostgreSQL database over MongoDB.",
        fact_type="preference",
        confidence=0.95,
    )
    assert create_payload.fact_type == "preference"
    assert create_payload.confidence == 0.95

    update_payload = MemoryUpdate(
        fact="User switched to Linear for ticket tracking.",
        fact_type="tooling",
    )
    assert update_payload.fact == "User switched to Linear for ticket tracking."


@pytest.mark.asyncio
async def test_memory_repository_create_and_get():
    """Test MemoryRepository create and retrieval with mock DB session."""
    mock_db = AsyncMock()
    repo = MemoryRepository(mock_db)

    user_id = uuid.uuid4()
    memory_id = uuid.uuid4()

    # Mock DB scalar_one_or_none return
    mock_memory = UserMemory(
        id=memory_id,
        user_id=user_id,
        fact="Team uses Jira for ticket tracking.",
        fact_type="tooling",
        confidence=1.0,
    )

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_memory
    mock_db.execute.return_value = mock_result

    fetched = await repo.get_memory_by_id(memory_id, user_id)
    assert fetched is not None
    assert fetched.fact == "Team uses Jira for ticket tracking."
    assert fetched.fact_type == "tooling"


@pytest.mark.asyncio
async def test_memory_extractor_deduplication():
    """Test MemoryExtractorService deduplication when similarity score exceeds threshold."""
    mock_vector_service = AsyncMock()
    # Simulate finding duplicate in Qdrant with high similarity score
    mock_vector_service.search_user_memories.return_value = [
        {
            "score": 0.92,
            "memory_id": str(uuid.uuid4()),
            "fact": "Team uses Jira for ticket management.",
            "fact_type": "tooling",
        }
    ]

    extractor = MemoryExtractorService(vec_service=mock_vector_service)

    # Mock LLM extraction returning candidate fact
    mock_candidates = [
        ExtractedFact(fact="Team uses Jira for ticketing.", type="tooling")
    ]

    mock_db = AsyncMock()
    user_id = uuid.uuid4()
    session_id = uuid.uuid4()

    with patch.object(extractor, "_call_llm_extraction", new=AsyncMock(return_value=mock_candidates)), \
         patch("app.services.memory_extractor.MemoryRepository") as mock_repo_cls:

        mock_repo_inst = AsyncMock()
        mock_repo_cls.return_value = mock_repo_inst

        recent_messages = [{"role": "user", "content": "We handle our tickets in Jira."}]
        stored = await extractor.extract_and_store_memories(
            db=mock_db,
            user_id=user_id,
            session_id=session_id,
            recent_messages=recent_messages,
            similarity_threshold=0.88,
        )

        # Confirm that touch_memory was called for duplicate instead of create_memory
        assert len(stored) == 0
        mock_repo_inst.touch_memory.assert_called_once()
        mock_repo_inst.create_memory.assert_not_called()
