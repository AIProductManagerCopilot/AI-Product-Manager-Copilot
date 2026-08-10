
"""
FastAPI Application Entrypoint and Lifecycle Configuration.

Integrates core domain routers, analytics engines, AI subsystems, security middleware,
structured logging, lifespan events, and global exception handling.
"""

from contextlib import asynccontextmanager
import os
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.exceptions import AppException, app_exception_handler
from app.core.logging import setup_logging
from app.middleware.error_handler import register_exception_handlers
from app.middleware.logging_middleware import RequestLoggingMiddleware
from app.middleware.security_middleware import SecurityHeadersMiddleware

# Force load environment variables from root .env
load_dotenv()

# Initialize structured logging on application boot
setup_logging(json_format=False, log_level="INFO")
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifecycle manager for startup and shutdown events.
    """
    logger.info(
        "Starting AI Product Manager Copilot Backend API",
        project_name=getattr(
            settings, "PROJECT_NAME", "AI Product Manager Copilot Backend API"
        ),
        environment=getattr(settings, "ENVIRONMENT", "development"),
        debug=getattr(settings, "DEBUG", False),
    )
    # Perform startup tasks (e.g. cache initialization, DB connection pool checks)
    yield
    # Perform graceful cleanup tasks on shutdown
    logger.info("Shutting down AI Product Manager Copilot Backend API")


def create_application() -> FastAPI:
    """Application factory for configuring and instantiating the FastAPI app."""
    title = getattr(
        settings, "PROJECT_NAME", "AI Product Manager Copilot Backend API"
    )
    api_v1_prefix = getattr(settings, "API_V1_STR", "/api/v1")

    app = FastAPI(
        title=title,
        description="Core backend analytics, AI ingestion pipeline engines, and workspace APIs",
        version="1.0.0",
        docs_url=f"{api_v1_prefix}/docs",
        redoc_url=f"{api_v1_prefix}/redoc",
        openapi_url=f"{api_v1_prefix}/openapi.json",
        lifespan=lifespan,
    )

    # 1. Standard dev origins and configured settings origins setup
    default_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    configured_origins = getattr(settings, "BACKEND_CORS_ORIGINS", [])

    origins = list(default_origins)
    for origin in configured_origins:
        origin_str = str(origin)
        if origin_str not in origins and origin_str != "*":
            origins.append(origin_str)

    if (
        getattr(settings, "BACKEND_CORS_ORIGINS", None) == ["*"]
        or "*" in configured_origins
    ):
        origins = ["*"]

    # 2. Enable CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time-MS"],
    )

    # 3. Custom Production Middlewares (Security & Request Logging)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # 4. Register Global Exception Handlers
    app.add_exception_handler(AppException, app_exception_handler)
    register_exception_handlers(app)

    # 5. Mount Unified API v1 Router Hierarchy
    app.include_router(api_router, prefix=api_v1_prefix)

    return app


app = create_application()


@app.get("/", tags=["Health Check"])
def read_root():
    """Root endpoint to verify backend server status and active engine execution."""
    return {
        "status": "Online",
        "engine": "FastAPI on Docker isolated port 5433 (Gemini Engine Active)",
    }


@app.get("/health", tags=["Health Check"])
async def root_health_check():
    """Application readiness and environment health check endpoint."""
    return {
        "status": "healthy",
        "app": getattr(settings, "PROJECT_NAME", "AI Product Manager Copilot Backend API"),
        "environment": getattr(settings, "ENVIRONMENT", "development"),
    }

@app.get("/health", tags=["Health Check"])
async def health_check() -> dict:
    """Standard health check endpoint for uptime monitoring and orchestrators."""
    return {
        "status": "healthy",
        "service": getattr(
            settings, "PROJECT_NAME", "AI Product Manager Copilot Backend API"
        ),
    }