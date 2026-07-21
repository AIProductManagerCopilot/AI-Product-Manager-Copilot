import sys
import logging
import structlog
from app.core.config import settings

def setup_logging(json_format: bool = False, log_level: str = "INFO") -> None:
    """
    Configures structured logging across standard library logging and structlog.
    Renders human-readable colored logs for development or machine-parseable JSON for production.
    """
    level = getattr(logging, log_level.upper(), logging.INFO)

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if json_format:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(level)

    # Mute noisy third-party loggers
    for logger_name in ["uvicorn", "uvicorn.error", "uvicorn.access", "httpx"]:
        mod_logger = logging.getLogger(logger_name)
        mod_logger.handlers.clear()
        mod_logger.propagate = True


def get_logger(name: str):
    """Returns a structured logger instance for a given module name."""
    return structlog.get_logger(name)