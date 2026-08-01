"""
Core Application Configuration Settings.
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    gemini_api_key: str = Field(
        default="demo_gemini_key", validation_alias="GEMINI_API_KEY"
    )
    embedding_model: str = Field(
        default="gemini-embedding-001", validation_alias="EMBEDDING_MODEL"
    )
    gemini_api_model: str = Field(
        default="gemini-2.0-flash", validation_alias="GEMINI_API_MODEL"
    )
    qdrant_url: str = Field(
        default="./qdrant_db", validation_alias="QDRANT_URL"
    )
    qdrant_collection: str = Field(
        default="product_context", validation_alias="QDRANT_COLLECTION"
    )
    embedding_dimension: int = Field(
        default=3072, validation_alias="EMBEDDING_DIMENSION"
    )


settings = Settings()