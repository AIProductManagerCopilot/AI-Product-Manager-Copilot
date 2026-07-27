# backend/tests/test_ai_subsystem.py
"""Integration test suite for the AI/RAG subsystem modules.

Repository-compatible implementation for production review.
"""

import pytest
from app.ai.context.builder import ContextPayload
from app.ai.prompts.registry import PromptRegistry, PromptVersion
from app.ai.streaming.generator import SSEEventBuilder
from app.ai.telemetry.metrics import AITelemetryTracker
from app.ai.vector_store.collections import DocumentChunkPayload


def test_document_chunk_payload_schema():
    """Verify Qdrant document chunk payload initialization."""
    chunk = DocumentChunkPayload(
        doc_id="doc_101",
        chunk_id="chunk_01",
        content="This is a test document chunk.",
        title="PRD Spec",
        source_type="PRD",
        created_at="2026-07-27T10:00:00Z",
    )
    assert chunk.doc_id == "doc_101"
    assert chunk.source_type == "PRD"


def test_prompt_registry_retrieval():
    """Verify prompt registry fetching and fallback logic."""
    registry = PromptRegistry()
    prompt = registry.get_prompt("copilot_assistant", version=PromptVersion.V1_0)
    
    assert prompt.name == "copilot_assistant"
    assert "AI Product Manager Copilot" in prompt.template


def test_ai_context_builder():
    """Verify context assembly with analytics and entity evidence."""
    payload = ContextPayload(
        query="What is the projected churn rate?",
        analytics_evidence={"churn_rate": "4.2%", "active_users": 12500},
        entity_snapshots={"workspace_id": "ws_999"},
        system_instructions="Answer concisely.",
    )
    
    formatted_prompt = payload.build_formatted_prompt()
    
    assert "=== SYSTEM INSTRUCTIONS ===" in formatted_prompt
    assert "churn_rate: 4.2%" in formatted_prompt
    assert "workspace_id: ws_999" in formatted_prompt


def test_sse_event_builder_formatting():
    """Verify Server-Sent Event data formatting."""
    event_str = SSEEventBuilder.format_event(
        event_type="token", 
        data={"delta": "Hello"}
    )
    
    assert event_str.startswith("event: token\n")
    assert 'data: {"delta": "Hello"}\n\n' in event_str


def test_ai_telemetry_tracker():
    """Verify latency timing and token counting heuristics."""
    tracker = AITelemetryTracker()
    tracker.start_timer()
    
    report = tracker.calculate_metrics(
        prompt_text="Hello world AI",
        completion_text="This is a response test",
        latency_ms=12.5,
    )
    
    assert report.prompt_tokens == 3
    assert report.completion_tokens == 5
    assert report.total_tokens == 8
    assert report.latency_ms == 12.5