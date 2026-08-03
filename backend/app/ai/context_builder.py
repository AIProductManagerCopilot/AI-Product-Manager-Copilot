"""
Context Builder for RAG Pipeline.
Assembles, compresses, and grounds database and vector retrieval payloads into Gemini System Prompts.
"""

import logging
from typing import Any, Dict, List, Optional
from app.services.vector_service import vector_service

logger = logging.getLogger(__name__)


class ContextBuilder:
    """Constructs optimized context blocks and grounded system prompts for Gemini."""

    @staticmethod
    def format_retrieved_evidence(retrieved_docs: List[Dict[str, Any]]) -> str:
        """
        Formats Qdrant vector retrieval results into clean, Markdown-structured evidence blocks.
        """
        if not retrieved_docs:
            return "No relevant customer feedback evidence found in vector store."

        formatted_blocks = []
        for idx, doc in enumerate(retrieved_docs, 1):
            metadata = doc.get("metadata", {})
            text = doc.get("text", "").strip()
            score = doc.get("score", 0.0)
            category = metadata.get("category", "General")
            sentiment = metadata.get("sentiment", "Neutral")
            priority = metadata.get("priority_score", "N/A")

            block = (
                f"### Evidence #{idx} [Relevance Score: {score:.2f}]\n"
                f"- **Category:** {category}\n"
                f"- **Sentiment:** {sentiment}\n"
                f"- **Priority Score:** {priority}\n"
                f"- **User Feedback:** \"{text}\"\n"
            )
            formatted_blocks.append(block)

        return "\n".join(formatted_blocks)

    async def build_prd_prompt(
        self,
        feature_name: str,
        user_query: str,
        category_filter: Optional[str] = None,
        limit: int = 5,
    ) -> Dict[str, str]:
        """
        Retrieves vector evidence from Qdrant and constructs a grounded PRD generation prompt.
        """
        # 1. Retrieve Vector Grounding Context
        retrieved_docs = await vector_service.search_similar_context(
            query=f"{feature_name} {user_query}",
            limit=limit,
            category_filter=category_filter,
        )

        evidence_text = self.format_retrieved_evidence(retrieved_docs)

        # 2. Construct System Instructions (Persona & Grounding Guardrails)
        system_instruction = (
            "You are an expert Senior Product Manager (AI Product Manager Copilot). "
            "Your objective is to generate a comprehensive, actionable Product Requirement Document (PRD) "
            "strictly based on real customer feedback and data evidence provided below.\n\n"
            "STRICT GROUNDING RULES:\n"
            "1. Base your functional requirements and problem statement directly on the provided feedback evidence.\n"
            "2. Do NOT hallucinate features unsupported by customer pain points.\n"
            "3. Include clear User Stories, Acceptance Criteria, and Technical Scope.\n"
            "4. Assign priority levels (P0, P1, P2) matching customer sentiment and priority scores."
        )

        # 3. Construct Final Prompt
        user_prompt = (
            f"# PRD Generation Request\n"
            f"**Feature / Subject:** {feature_name}\n"
            f"**Specific Focus:** {user_query}\n\n"
            f"## Customer Feedback Evidence (Retrieved from Qdrant Vector Store):\n"
            f"{evidence_text}\n\n"
            f"## Task Instructions:\n"
            f"Generate a formal Markdown PRD with the following structure:\n"
            f"1. **Executive Summary & Problem Statement**\n"
            f"2. **User Pain Points & Evidence Analysis**\n"
            f"3. **Proposed Feature Requirements (P0 / P1 / P2)**\n"
            f"4. **User Stories & Acceptance Criteria**\n"
            f"5. **Success Metrics & Business Impact**\n"
        )

        return {
            "system_instruction": system_instruction,
            "prompt": user_prompt,
            "evidence_count": len(retrieved_docs),
        }

    async def build_theme_intelligence_prompt(
        self,
        cluster_topic: str,
        category_filter: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        Constructs a prompt for synthesizing deep strategic cluster insights and business recommendations.
        """
        retrieved_docs = await vector_service.search_similar_context(
            query=cluster_topic,
            limit=8,
            category_filter=category_filter,
        )

        evidence_text = self.format_retrieved_evidence(retrieved_docs)

        system_instruction = (
            "You are an elite AI Chief Product Officer and Analytics Strategist. "
            "Analyze customer feedback clusters and provide executive-level strategic recommendations."
        )

        user_prompt = (
            f"# Theme Intelligence Request\n"
            f"**Cluster Topic:** {cluster_topic}\n\n"
            f"## Underlying Customer Feedback Cluster Data:\n"
            f"{evidence_text}\n\n"
            f"## Required Output:\n"
            f"Provide a strategic intelligence memo including:\n"
            f"1. **Root Cause Analysis**\n"
            f"2. **Customer Friction Assessment**\n"
            f"3. **Recommended Product Action Plan**\n"
        )

        return {
            "system_instruction": system_instruction,
            "prompt": user_prompt,
            "evidence_count": len(retrieved_docs),
        }


# Global Singleton Instance
context_builder = ContextBuilder()