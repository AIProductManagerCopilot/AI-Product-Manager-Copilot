"""
Session Summarization Service for Chat Memory.

Folds older chat messages into a rolling session summary using LLM synthesis,
preserving key product requirements, technical decisions, constraints, user preferences,
and current objectives while eliminating fluff and repetition.
"""

import structlog
from typing import List, Optional, Any
from app.services.gemini import GeminiService
from app.core.tokenizer import count_tokens

logger = structlog.get_logger(__name__)


class SessionSummarizerService:
    """Service that synthesizes conversation history into a concise rolling summary."""

    def __init__(self, gemini_service: Optional[GeminiService] = None):
        self.gemini_service = gemini_service or GeminiService()

    async def summarize_session(
        self,
        existing_summary: Optional[str],
        messages_to_fold: List[Any],
    ) -> str:
        """
        Synthesizes existing summary and new messages into an updated rolling summary.

        Args:
            existing_summary: Current session.summary text (or None).
            messages_to_fold: List of ChatMessage objects or dicts to be summarized.

        Returns:
            Updated summary string.
        """
        if not messages_to_fold:
            return existing_summary or ""

        formatted_messages_list = []
        for msg in messages_to_fold:
            role = getattr(msg, "role", None) or (msg.get("role") if isinstance(msg, dict) else "user")
            content = getattr(msg, "content", None) or (msg.get("content") if isinstance(msg, dict) else "")
            role_display = "User" if role == "user" else ("Assistant" if role == "assistant" else "System")
            if content:
                formatted_messages_list.append(f"{role_display}: {content.strip()}")

        formatted_messages = "\n".join(formatted_messages_list)

        prompt = f"""
Existing conversation summary:
{existing_summary or "(none)"}

New conversation messages to fold into the summary:
{formatted_messages}

Task: Update the conversation summary by integrating the new messages into a clean, structured rolling summary.

Preserve:
- Product requirements & feature definitions
- Technical decisions & architecture choices
- Constraints, risks, & dependencies
- User preferences & team details
- Current objective & active topic

Discard:
- Greetings, pleasantries, & small talk
- Repeated or superseded information

Format: Keep the summary concise, bulleted, and well-structured under key headers.
"""
        logger.info("Executing LLM session summarization call", message_count=len(messages_to_fold))
        try:
            summary_text = await self.gemini_service.generate_text(prompt)
            if summary_text:
                return summary_text
        except Exception as exc:
            logger.error("LLM session summarization failed, generating fallback summary", error=str(exc))

        # Fallback summary generator if LLM call fails
        lines = []
        if existing_summary:
            lines.append(existing_summary)
        lines.append(f"Recent updates ({len(messages_to_fold)} messages folded):")
        for msg in messages_to_fold[:3]:
            content = getattr(msg, "content", "")
            if content:
                lines.append(f"- {content[:100]}...")
        return "\n".join(lines)
