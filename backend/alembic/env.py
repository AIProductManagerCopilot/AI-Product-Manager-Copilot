"""
Alembic Environment Migration Configuration.

Configures asynchronous execution of database migrations for SQLAlchemy 2.0 models.
"""

import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings
from app.models.core_models import Base  # Imports your project's Base metadata
from app.models.chat_models import ChatSession, ChatMessage  # noqa: F401  — Phase 0 chat tables

# Alembic Config object
config = context.config

if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    """
    Retrieve database connection URL from environment variable,
    settings.DATABASE_URL, or alembic.ini fallback,
    ensuring the asyncpg driver prefix and proper SSL flags are applied.
    """
    url = (
        os.getenv("DATABASE_URL")
        or getattr(settings, "DATABASE_URL", None)
        or config.get_main_option("sqlalchemy.url", "")
    )
    url = str(url).strip()

    # Ensure async driver scheme is used for SQLAlchemy async engine
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # asyncpg expects ssl= rather than sslmode=
    if "sslmode=" in url:
        url = (
            url.replace("sslmode=require", "ssl=require")
            .replace("sslmode=prefer", "ssl=prefer")
            .replace("sslmode=disable", "ssl=disable")
            .replace("sslmode=allow", "ssl=allow")
        )

    # Strip incompatible channel_binding parameter if present
    if "&channel_binding=require" in url:
        url = url.replace("&channel_binding=require", "")
    elif "?channel_binding=require&" in url:
        url = url.replace("channel_binding=require&", "")
    elif "?channel_binding=require" in url:
        url = url.replace("?channel_binding=require", "")

    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode without an active DB connection."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    """Callback function to run migrations within a synchronous wrapper."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,  # Detect column type changes
        compare_server_default=True,  # Detect default value changes
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode using async SQLAlchemy engine."""
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_url()

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point for online migrations."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()