from typing import List, Dict, Any
from app.core.exceptions import ContextAssemblyError

class PromptBuilder:
    """Assembles system context, retrieved vector chunks, and user queries into prompts."""

    @staticmethod
    def build_rag_prompt(user_query: str, retrieved_chunks: List[Dict[str, Any]]) -> str:
        try:
            context_blocks = []
            for idx, chunk in enumerate(retrieved_chunks, start=1):
                payload = chunk.get("payload", {})
                text_content = payload.get("text", payload.get("content", ""))
                context_blocks.append(f"[Context {idx}]:\n{text_content}")
            
            formatted_context = "\n\n".join(context_blocks) if context_blocks else "No relevant context found."

            system_instruction = (
                "You are an AI Product Manager Copilot. Use the following retrieved product context "
                "to provide clear, actionable, and structured product decisions. "
                "If context is insufficient, rely on general PM best practices while stating limitations."
            )

            prompt = (
                f"{system_instruction}\n\n"
                f"--- RETRIEVED CONTEXT ---\n"
                f"{formatted_context}\n"
                f"-------------------------\n\n"
                f"USER QUERY: {user_query}\n\n"
                f"RESPONSE:"
            )
            return prompt
        except Exception as exc:
            raise ContextAssemblyError(f"Failed to build RAG prompt: {str(exc)}") from exc