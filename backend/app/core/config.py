"""
Core Application Configuration Settings.
"""

import os
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Project Information
    PROJECT_NAME: str = "AI Product Manager Copilot"
    API_V1_STR: str = "/api/v1"

    # Gemini AI Configuration
    gemini_api_key: str = Field(
        default="demo_gemini_key", validation_alias="GEMINI_API_KEY"
    )
    gemini_model: str = Field(
        default="gemini-2.5-flash", validation_alias="GEMINI_MODEL"
    )
    gemini_api_model: str = Field(
        default="gemini-2.5-flash", validation_alias="GEMINI_API_MODEL"
    )

    # Embedding Settings
    embedding_model: str = Field(
        default="text-embedding-004", validation_alias="EMBEDDING_MODEL"
    )
    embedding_dimension: int = Field(
        default=768, validation_alias="EMBEDDING_DIMENSION"
    )

    # Vector DB (Qdrant) Configuration
    qdrant_url: str = Field(
        default="http://127.0.0.1:6333", validation_alias="QDRANT_URL"
    )
    qdrant_host: str = Field(
        default="localhost", validation_alias="QDRANT_HOST"
    )
    qdrant_port: int = Field(
        default=6333, validation_alias="QDRANT_PORT"
    )
    qdrant_grpc_port: int = Field(
        default=6334, validation_alias="QDRANT_GRPC_PORT"
    )
    qdrant_collection: str = Field(
        default="feedback_clusters", validation_alias="QDRANT_COLLECTION"
    )

    # Dynamic path resolution to automatically find root .env (4 levels up from this file)
    model_config = SettingsConfigDict(
        env_file=os.path.join(
            Path(__file__).resolve().parent.parent.parent.parent, ".env"
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()