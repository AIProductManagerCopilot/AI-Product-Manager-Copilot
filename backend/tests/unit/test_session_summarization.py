"""
Unit Tests for Phase 3 — Session Summarization & Memory.

Tests:
1. SessionSummarizerService synthesizes existing summary + new messages.
2. ChatRepository methods for token calculation, message folding, and summary updates.
3. ChatService.maybe_summarize threshold checks and automatic triggering on create_message.
4. PromptBuilder RAG prompt inclusion of session summary and sliding window history.
"""

import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.chat_models import ChatMessage, ChatSession
from app.repositories.chat_repository import ChatRepository
from app.services.application.chat_service import ChatService
from app.services.prompt_builder import PromptBuilder
from app.services.summarizer import SessionSummarizerService


@pytest.mark.asyncio
async def test_session_summarizer_service():
    """Validates that SessionSummarizerService builds prompt and calls GeminiService."""
    mock_gemini = AsyncMock()
    mock_gemini.generate_text.return_value = "- User is building an AI PM Copilot.\n- MVP includes PRD generation."

    summarizer = SessionSummarizerService(gemini_service=mock_gemini)

    messages = [
        ChatMessage(role="user", content="We are building an AI Product Manager Copilot."),
        ChatMessage(role="assistant", content="That sounds great! What are the MVP features?"),
        ChatMessage(role="user", content="PRD generation is part of the MVP."),
    ]

    summary = await summarizer.summarize_session(
        existing_summary=None,
        messages_to_fold=messages,
    )

    assert "AI PM Copilot" in summary
    assert "PRD generation" in summary
    assert mock_gemini.generate_text.called


@pytest.mark.asyncio
async def test_session_summarizer_fallback_on_llm_error():
    """Validates that SessionSummarizerService falls back gracefully if Gemini API throws an exception."""
    mock_gemini = AsyncMock()
    mock_gemini.generate_text.side_effect = Exception("API rate limit exceeded")

    summarizer = SessionSummarizerService(gemini_service=mock_gemini)

    messages = [
        ChatMessage(role="user", content="Feature request for Jira integration."),
        ChatMessage(role="assistant", content="Understood."),
    ]

    summary = await summarizer.summarize_session(
        existing_summary="Existing project notes.",
        messages_to_fold=messages,
    )

    assert "Existing project notes." in summary
    assert "folded" in summary.lower()


@pytest.mark.asyncio
async def test_chat_repository_unsummarized_helpers():
    """Validates ChatRepository token counting and message partitioning for summarization."""
    mock_db = AsyncMock()
    repo = ChatRepository(mock_db)

    user_id = uuid.uuid4()
    session_id = uuid.uuid4()
    session = ChatSession(id=session_id, user_id=user_id, summary=None)

    # Mock get_session_by_id
    repo.get_session_by_id = AsyncMock(return_value=session)

    # Mock DB query results for get_unsummarized_token_count
    msg1 = ChatMessage(id=uuid.uuid4(), session_id=session_id, role="user", content="Hello", token_count=10, is_summarized=False)
    msg2 = ChatMessage(id=uuid.uuid4(), session_id=session_id, role="assistant", content="Hi there", token_count=15, is_summarized=False)
    msg3 = ChatMessage(id=uuid.uuid4(), session_id=session_id, role="user", content="Detailed plan", token_count=50, is_summarized=False)
    msg4 = ChatMessage(id=uuid.uuid4(), session_id=session_id, role="assistant", content="Response", token_count=30, is_summarized=False)

    mock_result_unsummarized = MagicMock()
    mock_result_unsummarized.scalars.return_value.all.return_value = [msg1, msg2, msg3, msg4]

    mock_db.execute.return_value = mock_result_unsummarized

    count = await repo.get_unsummarized_token_count(session_id, user_id)
    assert count == 105

    # Test get_messages_for_summarization keeping last 2
    messages_to_fold = await repo.get_messages_for_summarization(session_id, user_id, keep_last_n=2)
    assert len(messages_to_fold) == 2
    assert messages_to_fold == [msg1, msg2]


@pytest.mark.asyncio
async def test_chat_service_maybe_summarize_under_threshold():
    """Ensures maybe_summarize does not trigger LLM summarization if unsummarized tokens <= max_raw_tokens."""
    mock_repo = AsyncMock()
    mock_summarizer = AsyncMock()

    user_id = uuid.uuid4()
    session_id = uuid.uuid4()

    mock_repo.get_unsummarized_token_count.return_value = 500
    mock_repo.get_session_by_id.return_value = ChatSession(id=session_id, user_id=user_id, summary="Current summary")

    service = ChatService(repo=mock_repo, summarizer=mock_summarizer)

    result_summary = await service.maybe_summarize(
        session_id=session_id,
        user_id=user_id,
        max_raw_tokens=4000,
        keep_last_n=6,
    )

    assert result_summary == "Current summary"
    assert not mock_summarizer.summarize_session.called


@pytest.mark.asyncio
async def test_chat_service_maybe_summarize_over_threshold():
    """Ensures maybe_summarize triggers summarization and updates database when tokens exceed threshold."""
    mock_repo = AsyncMock()
    mock_summarizer = AsyncMock()

    user_id = uuid.uuid4()
    session_id = uuid.uuid4()

    msg1 = ChatMessage(id=uuid.uuid4(), session_id=session_id, role="user", content="Old msg 1", token_count=2500)
    msg2 = ChatMessage(id=uuid.uuid4(), session_id=session_id, role="assistant", content="Old msg 2", token_count=2000)

    mock_repo.get_unsummarized_token_count.return_value = 4500
    mock_repo.get_messages_for_summarization.return_value = [msg1, msg2]
    mock_repo.get_session_by_id.return_value = ChatSession(id=session_id, user_id=user_id, summary="Initial summary")

    mock_summarizer.summarize_session.return_value = "Updated rolling summary."

    service = ChatService(repo=mock_repo, summarizer=mock_summarizer)

    new_summary = await service.maybe_summarize(
        session_id=session_id,
        user_id=user_id,
        max_raw_tokens=4000,
        keep_last_n=6,
    )

    assert new_summary == "Updated rolling summary."
    assert mock_summarizer.summarize_session.called
    assert mock_repo.update_session_summary.called
    assert mock_repo.mark_messages_as_summarized.called


def test_prompt_builder_includes_summary_and_history():
    """Validates that PromptBuilder includes SESSION SUMMARY and RECENT CONVERSATION HISTORY in prompt output."""
    chunks = [{"content": "Customer wants dark mode support.", "chunk_id": "chunk-1"}]
    recent_msgs = [
        {"role": "user", "content": "How's the roadmap for dark mode?"},
        {"role": "assistant", "content": "It's planned for Q3."},
    ]
    session_summary = "- Technical decision: React frontend\n- Feature: Dark mode requested"

    prompt = PromptBuilder.build_rag_prompt(
        user_query="When will dark mode ship?",
        retrieved_chunks=chunks,
        recent_messages=recent_msgs,
        session_summary=session_summary,
    )

    assert "--- SESSION SUMMARY ---" in prompt
    assert "Technical decision: React frontend" in prompt
    assert "--- RECENT CONVERSATION HISTORY ---" in prompt
    assert "User: How's the roadmap for dark mode?" in prompt
    assert "--- RETRIEVED CUSTOMER EVIDENCE & PRODUCT CONTEXT ---" in prompt
    assert "Customer wants dark mode support." in prompt
