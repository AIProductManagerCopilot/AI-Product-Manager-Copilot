from typing import List, Dict, Any
from app.core.exceptions import ContextAssemblyError


class PromptBuilder:
    """Assembles system context, retrieved vector chunks, and user queries into prompts."""

    @staticmethod
    def build_rag_prompt(
        user_query: str,
        retrieved_chunks: List[Dict[str, Any]],
        recent_messages: Optional[List[Any]] = None,
        session_summary: Optional[str] = None,
    ) -> str:
        try:
            context_blocks = []
            for idx, chunk in enumerate(retrieved_chunks, start=1):
                # Safely extract text across all dictionary representations
                payload = chunk.get("payload") or chunk.get("metadata") or {}
                text_content = (
                    chunk.get("content")
                    or chunk.get("text")
                    or payload.get("chunk_text")
                    or payload.get("text")
                    or payload.get("content")
                    or payload.get("feedback_text")
                    or ""
                ).strip()

                source_info = (
                    chunk.get("chunk_id")
                    or payload.get("chunk_id")
                    or payload.get("source_type")
                    or f"Chunk-{idx}"
                )

                if text_content:
                    context_blocks.append(f"[Evidence #{idx} | Source: {source_info}]:\n{text_content}")

            if context_blocks:
                formatted_context = "\n\n".join(context_blocks)
            else:
                formatted_context = "No specific vector database matches retrieved for this exact phrase."

            system_instruction = (
                "You are an expert AI Product Manager Copilot. Analyze the retrieved customer "
                "evidence, feedback snippets, and product context to answer the user's query with "
                "actionable, data-backed insights, feature priorities, and concrete recommendations.\n"
                "Ground your answers directly on the retrieved evidence below whenever available."
            )

            # Format session summary block if available
            summary_block = ""
            if session_summary and session_summary.strip():
                summary_block = (
                    f"--- SESSION SUMMARY ---\n"
                    f"{session_summary.strip()}\n"
                    f"-----------------------\n\n"
                )

            # Format sliding window conversation history block if available
            history_block = ""
            if recent_messages:
                history_lines = []
                for msg in recent_messages:
                    role = getattr(msg, "role", None) or (msg.get("role") if isinstance(msg, dict) else "user")
                    content = getattr(msg, "content", None) or (msg.get("content") if isinstance(msg, dict) else "")
                    role_display = "User" if role == "user" else ("Assistant" if role == "assistant" else "System")
                    if content:
                        history_lines.append(f"{role_display}: {content.strip()}")
                if history_lines:
                    formatted_history = "\n".join(history_lines)
                    history_block = (
                        f"--- RECENT CONVERSATION HISTORY ---\n"
                        f"{formatted_history}\n"
                        f"------------------------------------\n\n"
                    )

            prompt = (
                f"{system_instruction}\n\n"
                f"{summary_block}"
                f"{history_block}"
                f"--- RETRIEVED CUSTOMER EVIDENCE & PRODUCT CONTEXT ---\n"
                f"{formatted_context}\n"
                f"----------------------------------------------------\n\n"
                f"USER QUERY: {user_query}\n\n"
                f"RESPONSE:"
            )
            return prompt
        except Exception as exc:
            raise ContextAssemblyError(f"Failed to build RAG prompt: {str(exc)}") from exc