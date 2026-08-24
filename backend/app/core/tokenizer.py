"""
Token Counting Utilities for Context Window Budgeting.

Uses tiktoken for fast, local BPE tokenization matching standard LLM context windows.
Provides fallback mechanisms if text is empty or encoding encounters issues.
"""

import math
import structlog
from typing import Optional

logger = structlog.get_logger(__name__)

# Global cached tokenizer instance
_ENCODING = None


def _get_encoding():
    """Lazily loads and caches the default BPE tokenizer encoding."""
    global _ENCODING
    if _ENCODING is None:
        import tiktoken
        try:
            # cl100k_base is standard for GPT-4, GPT-3.5, and fine baseline for Gemini/Groq context windows
            _ENCODING = tiktoken.get_encoding("cl100k_base")
        except Exception as exc:
            logger.warning("Failed to initialize tiktoken encoding", error=str(exc))
            _ENCODING = None
    return _ENCODING


def count_tokens(text: Optional[str]) -> int:
    """
    Computes token count for a string payload synchronously.

    Args:
        text: Input string to tokenize.

    Returns:
        Integer token count (>= 0).
    """
    if not text:
        return 0

    try:
        encoding = _get_encoding()
        if encoding is not None:
            return len(encoding.encode(text))
    except Exception as exc:
        logger.warning("Token counting fallback triggered", error=str(exc))

    # Fallback estimate: roughly 4 characters per token
    return max(1, math.ceil(len(text) / 4))
