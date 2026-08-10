"""
Core Application Configuration Settings via Pydantic Settings.

Combines core app config, relational database settings, database pool options, CORS,
authentication, vector search (Qdrant), Redis, and AI/Gemini engine settings with
full backwards compatibility.
"""

import json
from typing import Any, List, Optional, Union
from pydantic import AliasChoices, Field, ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Global application settings with environment variable loading and validation."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --------------------------------------------------------------------------
    # Core Application Settings
    # --------------------------------------------------------------------------
    PROJECT_NAME: str = Field(
        default="Feedback Intelligence Engine",
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

    # --------------------------------------------------------------------------
    # Security & JWT Configuration
    # --------------------------------------------------------------------------
    SECRET_KEY: str = Field(
        default="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
        description="Secret key for JWT encoding and security hashing",
    )
    ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60 * 24 * 8, description="Access token expiration window in minutes (8 days)"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7, description="Refresh token expiration window in days"
    )
    REFRESH_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60 * 24 * 30, description="Refresh token expiration window in minutes (30 days)"
    )

    # --------------------------------------------------------------------------
    # CORS Configuration
    # --------------------------------------------------------------------------
    CORS_ORIGINS: Union[List[str], str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:8000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8000",
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

    # --------------------------------------------------------------------------
    # Relational Database Settings (PostgreSQL with SQLite fallback)
    # --------------------------------------------------------------------------
    POSTGRES_SERVER: str = Field(default="localhost", description="PostgreSQL host address")
    POSTGRES_PORT: int = Field(default=5432, description="PostgreSQL port")
    POSTGRES_USER: str = Field(default="postgres", description="PostgreSQL username")
    POSTGRES_PASSWORD: str = Field(default="postgres", description="PostgreSQL password")
    POSTGRES_DB: str = Field(default="app_db", description="PostgreSQL database name")
    DATABASE_URL: str = Field(
        default="sqlite:///./app.db",
        validation_alias=AliasChoices("DATABASE_URL", "SQLALCHEMY_DATABASE_URI"),
        description="Database connection string (auto-assembled for Async PostgreSQL if unconfigured)",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Any, info: ValidationInfo) -> str:
        """Assembles PostgreSQL async URI if explicitly configured, otherwise falls back to SQLite."""
        if isinstance(v, str) and v.strip() and v != "sqlite:///./app.db":
            return v
        values = info.data
        if values.get("POSTGRES_SERVER") and values.get("POSTGRES_DB"):
            user = values.get("POSTGRES_USER", "postgres")
            password = values.get("POSTGRES_PASSWORD", "postgres")
            server = values.get("POSTGRES_SERVER", "localhost")
            port = values.get("POSTGRES_PORT", 5432)
            db = values.get("POSTGRES_DB", "app_db")
            return f"postgresql+asyncpg://{user}:{password}@{server}:{port}/{db}"
        return v or "sqlite:///./app.db"

    # Database Connection Pool Configuration
    DB_POOL_SIZE: int = Field(default=20, description="SQLAlchemy connection pool size")
    DB_MAX_OVERFLOW: int = Field(default=10, description="SQLAlchemy connection max overflow")
    DB_POOL_TIMEOUT: int = Field(default=30, description="SQLAlchemy pool timeout in seconds")
    DB_ECHO: bool = Field(default=False, description="SQLAlchemy engine SQL echo logging flag")

    # --------------------------------------------------------------------------
    # Redis Cache & Task Queue
    # --------------------------------------------------------------------------
    REDIS_HOST: str = Field(default="localhost", description="Redis host address")
    REDIS_PORT: int = Field(default=6379, description="Redis server port")
    REDIS_DB: int = Field(default=0, description="Redis database index")
    REDIS_PASSWORD: Optional[str] = Field(default=None, description="Redis authentication password")

    @property
    def REDIS_URL(self) -> str:
        """Computes Redis connection URL string."""
        auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
        return f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # --------------------------------------------------------------------------
    # Qdrant Vector Database Settings
    # --------------------------------------------------------------------------
    QDRANT_HOST: str = Field(default="localhost", description="Qdrant host address")
    QDRANT_PORT: int = Field(default=6333, description="Qdrant HTTP port")
    QDRANT_GRPC_PORT: int = Field(default=6334, description="Qdrant gRPC port")
    QDRANT_API_KEY: str = Field(default="", description="Qdrant API key")
    QDRANT_URL: str = Field(
        default="./qdrant_db",
        validation_alias=AliasChoices("QDRANT_URL", "qdrant_url"),
        description="Local or remote Qdrant connection URL/path",
    )
    QDRANT_COLLECTION: str = Field(
        default="product_context",
        validation_alias=AliasChoices("QDRANT_COLLECTION", "qdrant_collection"),
        description="Default vector search collection name",
    )

    # --------------------------------------------------------------------------
    # AI Engine & Gemini Integration Settings
    # --------------------------------------------------------------------------
    GEMINI_API_KEY: str = Field(
        default="demo_gemini_key",
        validation_alias=AliasChoices("GEMINI_API_KEY", "gemini_api_key"),
        description="Google Gemini API key",
    )
    GEMINI_MODEL_NAME: str = Field(
        default="gemini-2.5-flash",
        validation_alias=AliasChoices("GEMINI_MODEL_NAME", "GEMINI_API_MODEL", "gemini_api_model"),
        description="Default Gemini generative model name",
    )
    EMBEDDING_MODEL_NAME: str = Field(
        default="text-embedding-004",
        validation_alias=AliasChoices("EMBEDDING_MODEL_NAME", "EMBEDDING_MODEL", "embedding_model"),
        description="Default embedding model name",
    )
    EMBEDDING_DIMENSION: int = Field(
        default=3072,
        validation_alias=AliasChoices("EMBEDDING_DIMENSION", "embedding_dimension"),
        description="Vector space dimension for embeddings",
    )

    # --------------------------------------------------------------------------
    # Backward Compatibility Properties & Aliases
    # --------------------------------------------------------------------------
    @property
    def APP_NAME(self) -> str:
        return self.PROJECT_NAME

    @property
    def APP_ENV(self) -> str:
        return self.ENVIRONMENT

    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        return self.CORS_ORIGINS if isinstance(self.CORS_ORIGINS, list) else [self.CORS_ORIGINS]

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return self.DATABASE_URL

    @property
    def gemini_api_key(self) -> str:
        return self.GEMINI_API_KEY

    @property
    def gemini_api_model(self) -> str:
        return self.GEMINI_MODEL_NAME

    @property
    def embedding_model(self) -> str:
        return self.EMBEDDING_MODEL_NAME

    @property
    def embedding_dimension(self) -> int:
        return self.EMBEDDING_DIMENSION

    @property
    def qdrant_url(self) -> str:
        return self.QDRANT_URL

    @property
    def qdrant_collection(self) -> str:
        return self.QDRANT_COLLECTION


# Global singleton settings instance
settings = Settings()