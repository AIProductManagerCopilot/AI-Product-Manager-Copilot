# backend/app/ai/prompts/registry.py
"""Prompt version control, template registry, and Gemini configuration loader.

Repository-compatible implementation for production review.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PromptVersion(str, Enum):
    V1_0 = "1.0"
    V1_1 = "1.1"


class SystemPromptTemplate(BaseModel):
    """Container for system prompt metadata and content."""

    name: str = Field(..., description="Prompt identifier")
    version: PromptVersion = Field(default=PromptVersion.V1_0)
    template: str = Field(..., description="Raw prompt template with format placeholders")
    description: str = Field(..., description="Purpose and usage notes")


class PromptRegistry:
    """Central registry for managing prompt versions and safety guardrails."""

    def __init__(self) -> None:
        self._prompts: Dict[str, Dict[PromptVersion, SystemPromptTemplate]] = {}
        self._load_default_prompts()

    def _load_default_prompts(self) -> None:
        """Register default system prompts."""
        copilot_v1 = SystemPromptTemplate(
            name="copilot_assistant",
            version=PromptVersion.V1_0,
            description="Default system instruction for AI Product Manager Copilot",
            template=(
                "You are an expert AI Product Manager Copilot. Your role is to assist product leads "
                "in analyzing metrics, document citations, and feature specifications. "
                "Always base your responses strictly on the provided analytics evidence and retrieved context. "
                "If information is missing, explicitly state what is absent."
            ),
        )
        self.register_prompt(copilot_v1)

    def register_prompt(self, prompt: SystemPromptTemplate) -> None:
        """Register a new or updated system prompt template."""
        if prompt.name not in self._prompts:
            self._prompts[prompt.name] = {}
        self._prompts[prompt.name][prompt.version] = prompt

    def get_prompt(
        self, name: str, version: Optional[PromptVersion] = None
    ) -> SystemPromptTemplate:
        """Retrieve a system prompt template by name and version."""
        if name not in self._prompts:
            raise KeyError(f"Prompt template '{name}' not found in registry.")

        versions = self._prompts[name]
        if version is None:
            # Default to latest registered version
            latest_version = max(versions.keys(), key=lambda v: v.value)
            return versions[latest_version]

        if version not in versions:
            raise KeyError(f"Version '{version}' for prompt '{name}' not found.")

        return versions[version]

    @staticmethod
    def get_default_safety_settings() -> List[Dict[str, Any]]:
        """Return standard Google Gemini safety categories and thresholds."""
        return [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ]
