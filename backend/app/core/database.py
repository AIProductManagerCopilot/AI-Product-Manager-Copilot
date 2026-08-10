"""
Database Connection and Session Management.

Provides both Async SQLAlchemy engine/session capabilities and legacy Sync fallback
compatibility. Handles automatic dialect normalization (asyncpg / aiosqlite), 
pool sizing allocations, declarative Base model definitions, structured logging, 
and FastAPI dependency injection providers.
"""

import os
from typing import AsyncGenerator, Generator
import structlog
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

logger = structlog.get_logger(__name__)

# -----------------------------------------------------------------------------
# Connection URL Assembly & Normalization
# -----------------------------------------------------------------------------
# Default fallback routing clear of native Windows service locks.
DEFAULT_DB_URL = (
    "postgresql://aipm_admin:aipm_secure_password123@127.0.0.1:5433/aipm_metadata"
)

raw_database_url = (
    getattr(settings, "DATABASE_URL", None)
    or getattr(settings, "SQLALCHEMY_DATABASE_URI", None)
    or os.getenv("DATABASE_URL")
    or DEFAULT_DB_URL
)

raw_db_str = str(raw_database_url)


def _resolve_async_url(url: str) -> str:
    """Ensures database URI uses the appropriate async driver dialect."""
    if url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return url


def _resolve_sync_url(url: str) -> str:
    """Ensures database URI uses standard synchronous driver dialect."""
    return (
        url.replace("postgresql+asyncpg://", "postgresql://")
        .replace("sqlite+aiosqlite://", "sqlite://")
    )


async_database_url = _resolve_async_url(raw_db_str)
sync_database_url = _resolve_sync_url(raw_db_str)


# -----------------------------------------------------------------------------
# Declarative Base Class
# -----------------------------------------------------------------------------
class Base(DeclarativeBase):
    """Declarative Base class for all SQLAlchemy ORM models."""

    pass


# -----------------------------------------------------------------------------
# Engine Arguments & Pool Configuration
# -----------------------------------------------------------------------------
db_echo = getattr(settings, "DB_ECHO", False) or getattr(settings, "DEBUG", False)
pool_size = getattr(settings, "DB_POOL_SIZE", 10)
max_overflow = getattr(settings, "DB_MAX_OVERFLOW", 20)
pool_timeout = getattr(settings, "DB_POOL_TIMEOUT", 30)

# Async Engine Setup
async_engine_kwargs = {
    "echo": db_echo,
    "future": True,
}

if not async_database_url.startswith("sqlite"):
    async_engine_kwargs.update(
        {
            "pool_size": pool_size,
            "max_overflow": max_overflow,
            "pool_timeout": pool_timeout,
            "pool_pre_ping": True,
        }
    )

engine: AsyncEngine = create_async_engine(
    async_database_url, **async_engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Sync Engine Setup (Backward Compatibility)
sync_engine_kwargs = {
    "echo": db_echo,
}

if not sync_database_url.startswith("sqlite"):
    sync_engine_kwargs.update(
        {
            "pool_size": pool_size,
            "max_overflow": max_overflow,
            "pool_timeout": pool_timeout,
            "pool_pre_ping": True,
        }
    )

sync_engine = create_engine(sync_database_url, **sync_engine_kwargs)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine,
)


# -----------------------------------------------------------------------------
# FastAPI Dependency Injection Providers & Database Utilities
# -----------------------------------------------------------------------------
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI Async Dependency Injection Provider.

    Yields an isolated transactional async database session context per incoming request 
    and guarantees automatic commit, rollback on failure, and secure session cleanup.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as exc:
            await session.rollback()
            logger.error(
                "Async database transaction error, rolling back", error=str(exc)
            )
            raise
        finally:
            await session.close()


def get_sync_db() -> Generator[Session, None, None]:
    """
    FastAPI Synchronous Dependency Injection Provider (Legacy / Sync Tasks).

    Yields an isolated synchronous transactional database session context per request.
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error(
            "Sync database transaction error, rolling back", error=str(exc)
        )
        raise
    finally:
        db.close()


async def init_db() -> None:
    """Creates database tables directly via SQLAlchemy metadata (primarily for dev/testing)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)