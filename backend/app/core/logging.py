"""
Core Application Structured Logging Configuration.

Configures structlog for high-performance, asynchronous-friendly structured logging
with support for console formatting in development and JSON formatting in production,
fully integrated with standard library logging, Uvicorn, SQLAlchemy, and external clients.
"""

import logging
import sys
from typing import List, Optional

import structlog

from app.core.config import settings


def setup_logging(
    json_format: Optional[bool] = None,
    log_level: Optional[str] = None,
) -> None:
    """
    Configures structlog and standard library logging integration.

    :param json_format: If True, outputs logs as JSON. If False, console formatting.
                        If None, defaults to settings configuration or environment (DEBUG mode).
    :param log_level: Minimum logging level ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL").
                      If None, defaults to settings or DEBUG/INFO toggle.
    """
    # Resolve debug status from settings
    is_debug = getattr(settings, "DEBUG", False)

    # Determine JSON format preference
    if json_format is None:
        json_format = getattr(
            settings,
            "LOG_JSON_FORMAT",
            not is_debug,
        )

    # Determine logging level
    if log_level is None:
        default_level_str = getattr(
            settings, "LOG_LEVEL", "DEBUG" if is_debug else "INFO"
        )
        numeric_level = getattr(logging, default_level_str.upper(), logging.INFO)
    elif isinstance(log_level, str):
        numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    else:
        numeric_level = logging.INFO

    # Shared processors used by both structlog and standard library formatters
    shared_processors: List[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    # Select output renderer based on environment configuration
    if json_format:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    # Configure primary structlog engine
    structlog.configure(
        processors=shared_processors
        + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Standard library log formatter routing through structlog
    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    # Console output stream handler
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.handlers = [stream_handler]
    root_logger.setLevel(numeric_level)

    # Align & silence third-party library loggers across Uvicorn, HTTP clients, and Vector DBs
    noisy_loggers = [
        "uvicorn",
        "uvicorn.error",
        "uvicorn.access",
        "httpx",
        "httpcore",
        "qdrant_client",
        "sqlalchemy.engine",
        "fastapi",
    ]

    for logger_name in noisy_loggers:
        mod_logger = logging.getLogger(logger_name)
        mod_logger.handlers = [stream_handler]
        mod_logger.propagate = False
        if not is_debug and logger_name in ("httpx", "httpcore", "qdrant_client"):
            mod_logger.setLevel(logging.WARNING)


def get_logger(name: str = __name__) -> structlog.stdlib.BoundLogger:
    """
    Returns a structured logger instance for a given module name.

    :param name: Module or logger namespace string.
    :return: Bound structlog logger.
    """
    return structlog.get_logger(name)