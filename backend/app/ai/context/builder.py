# app/ai/context/builder.py
"""AI Context Builder assembling evidence into deterministic context windows.

Repository-compatible implementation for production review.
"""

from typing import Any, Dict, List
from pydantic import BaseModel, Field


class ContextPayload(BaseModel):
    """Structured container for Gemini LLM context assembly."""

    query: str = Field(..., description="User query or prompt")
    vector_citations: List[Dict[str, Any]] = Field(
        default_factory=list, description="Retrieved vector chunks with metadata"
    )
    analytics_evidence: Dict[str, Any] = Field(
        default_factory=dict, description="Pre-computed KPIs provided by Harshita's service"
    )
    entity_snapshots: Dict[str, Any] = Field(
        default_factory=dict, description="Relational entity context provided by Madhu/Akhila"
    )
    system_instructions: str = Field(..., description="Active system prompt string")

    def build_formatted_prompt(self) -> str:
        """Construct the unified prompt string for Google Gemini."""
        prompt_parts = [
            f"=== SYSTEM INSTRUCTIONS ===\n{self.system_instructions}\n",
            f"=== USER QUERY ===\n{self.query}\n",
        ]

        if self.analytics_evidence:
            prompt_parts.append("=== ANALYTICS EVIDENCE (VERIFIED KPIs) ===")
            for key, val in self.analytics_evidence.items():
                prompt_parts.append(f"- {key}: {val}")
            prompt_parts.append("")

        if self.entity_snapshots:
            prompt_parts.append("=== ENTITY CONTEXT ===")
            for key, val in self.entity_snapshots.items():
                prompt_parts.append(f"- {key}: {val}")
            prompt_parts.append("")

        if self.vector_citations:
            prompt_parts.append("=== RETRIEVED DOCUMENT CITATIONS ===")
            for idx, citation in enumerate(self.vector_citations, start=1):
                payload = citation.get("payload", {})
                title = payload.get("title", "Untitled")
                content = payload.get("content", "")
                prompt_parts.append(f"[{idx}] Title: {title}\nContent: {content}\n")

        return "\n".join(prompt_parts)
