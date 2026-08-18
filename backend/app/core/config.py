"""
Core Application Configuration Settings via Pydantic Settings.

Combines core app config, relational database settings, database pool options, CORS,
authentication, vector search (Qdrant), Redis, and AI/Gemini engine settings with
full backwards compatibility.
"""

import json
import os
from pathlib import Path
from typing import Any, List, Optional, Union
from pydantic import AliasChoices, Field, ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Global application settings with environment variable loading and validation."""

    # Core Application Settings
    PROJECT_NAME: str = Field(
        default="AI Product Manager Copilot API",
        validation_alias=AliasChoices("PROJECT_NAME", "APP_NAME"),
        description="Application project title",
    )
    VERSION: str = Field(default="1.0.0", description="Application semantic version")
    API_V1_STR: str = Field(default="/api/v1", description="API V1 path prefix")
    ENVIRONMENT: str = Field(
        default="development",
        validation_alias=AliasChoices("ENVIRONMENT", "APP_ENV"),
        description="Deployment environment stage (development, staging, production)",
    )
    DEBUG: bool = Field(default=True, description="Debug mode flag")

    # Security & JWT Configuration
    SECRET_KEY: str = Field(
        default="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
        description="Secret key for JWT encoding and security hashing",
    )
    ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60 * 24 * 8, description="Access token expiration window in minutes (8 days)"
    )

    # Gemini AI Configuration
    gemini_api_key: str = Field(
        default="demo_gemini_key", validation_alias=AliasChoices("GEMINI_API_KEY", "gemini_api_key")
    )
    gemini_model: str = Field(
        default="gemini-3.6-flash", validation_alias=AliasChoices("GEMINI_MODEL", "gemini_model")
    )
    gemini_api_model: str = Field(
        default="gemini-3.6-flash", validation_alias=AliasChoices("GEMINI_API_MODEL", "gemini_api_model")
    )

    # Embedding Settings
    embedding_model: str = Field(
        default="text-embedding-004", validation_alias=AliasChoices("EMBEDDING_MODEL", "embedding_model")
    )
    embedding_dimension: int = Field(
        default=768, validation_alias=AliasChoices("EMBEDDING_DIMENSION", "embedding_dimension")
    )

    # Vector DB (Qdrant) Configuration
    qdrant_url: str = Field(
        default="http://127.0.0.1:6333", validation_alias=AliasChoices("QDRANT_URL", "qdrant_url")
    )
    qdrant_host: str = Field(
        default="localhost", validation_alias=AliasChoices("QDRANT_HOST", "qdrant_host")
    )
    qdrant_port: int = Field(
        default=6333, validation_alias=AliasChoices("QDRANT_PORT", "qdrant_port")
    )
    qdrant_grpc_port: int = Field(
        default=6334, validation_alias=AliasChoices("QDRANT_GRPC_PORT", "qdrant_grpc_port")
    )
    qdrant_collection: str = Field(
        default="feedback_clusters", validation_alias=AliasChoices("QDRANT_COLLECTION", "qdrant_collection")
    )

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
        ],
        validation_alias=AliasChoices("CORS_ORIGINS", "BACKEND_CORS_ORIGINS"),
        description="Allowed CORS origin URLs",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        """Parses comma-separated strings or JSON arrays into a list of origins."""
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    return json.loads(v_str)
                except Exception:
                    pass
            return [i.strip() for i in v_str.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(item) for item in v]
        return v

    # Relational Database Settings
    POSTGRES_SERVER: str = Field(default="localhost", description="PostgreSQL host address")
    POSTGRES_PORT: int = Field(default=5432, description="PostgreSQL port")
    POSTGRES_USER: str = Field(default="postgres", description="PostgreSQL username")
    POSTGRES_PASSWORD: str = Field(default="postgres", description="PostgreSQL password")
    POSTGRES_DB: str = Field(default="app_db", description="PostgreSQL database name")
    DATABASE_URL: str = Field(
        default="sqlite:///./app.db",
        validation_alias=AliasChoices("DATABASE_URL", "SQLALCHEMY_DATABASE_URI"),
        description="Database connection string",
    )

    # Database Connection Pool Configuration
    DB_POOL_SIZE: int = Field(default=20, description="SQLAlchemy connection pool size")
    DB_MAX_OVERFLOW: int = Field(default=10, description="SQLAlchemy connection max overflow")
    DB_POOL_TIMEOUT: int = Field(default=30, description="SQLAlchemy pool timeout in seconds")
    DB_ECHO: bool = Field(default=False, description="SQLAlchemy engine SQL echo logging flag")

    # Redis Cache & Task Queue
    REDIS_HOST: str = Field(default="localhost", description="Redis host address")
    REDIS_PORT: int = Field(default=6379, description="Redis server port")
    REDIS_DB: int = Field(default=0, description="Redis database index")
    REDIS_PASSWORD: Optional[str] = Field(default=None, description="Redis authentication password")

    @property
    def REDIS_URL(self) -> str:
        """Computes Redis connection URL string."""
        auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
        return f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Dynamic path resolution to automatically find root .env
    model_config = SettingsConfigDict(
        env_file=os.path.join(
            Path(__file__).resolve().parent.parent.parent.parent, ".env"
        ),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()