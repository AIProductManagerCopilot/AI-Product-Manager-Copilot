from typing import List, Dict, Any, Optional
from app.core.exceptions import ContextAssemblyError


class PromptBuilder:
    """Assembles system context, long-term user memories, session summary, chat history, and retrieved vector chunks into prompts."""

    @staticmethod
    def build_rag_prompt(
        user_query: str,
        retrieved_chunks: List[Dict[str, Any]],
        recent_messages: Optional[List[Any]] = None,
        session_summary: Optional[str] = None,
        retrieved_memories: Optional[List[Dict[str, Any]]] = None,
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
                "evidence, feedback snippets, long-term memory facts, and product context to answer the user's query with "
                "actionable, data-backed insights, feature priorities, and concrete recommendations.\n"
                "Ground your answers directly on the retrieved evidence and known facts below whenever available."
            )

            # Format persistent long-term memories block if available
            memory_block = ""
            if retrieved_memories:
                memory_lines = []
                for idx, mem in enumerate(retrieved_memories, start=1):
                    fact = mem.get("fact") or mem.get("text") or ""
                    fact_type = mem.get("fact_type", "fact")
                    if fact:
                        memory_lines.append(f"• [{fact_type.upper()}] {fact.strip()}")
                if memory_lines:
                    formatted_memories = "\n".join(memory_lines)
                    memory_block = (
                        f"--- PERSISTENT RELEVANT MEMORIES (USER & PROJECT FACTS) ---\n"
                        f"{formatted_memories}\n"
                        f"-----------------------------------------------------------\n\n"
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
                f"{memory_block}"
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