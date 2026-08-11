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
from app.api.v1 import feedback
from app.api.v1 import copilot
from app.ai.router import router as ai_router
from app.api.v1 import projects
from app.api.v1.endpoints.analytics import router as analytics_router
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
        project_name=getattr(settings, "PROJECT_NAME", "AI Product Manager Copilot Backend API"),
        environment=getattr(settings, "ENVIRONMENT", "development"),
        debug=getattr(settings, "DEBUG", False),
    )
    yield
    logger.info("Shutting down AI Product Manager Copilot Backend API")


def create_application() -> FastAPI:
    """Application factory for configuring and instantiating the FastAPI app."""
    title = getattr(settings, "PROJECT_NAME", "AI Product Manager Copilot API")
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

    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time-MS"],
    )

    # Security & Request Logging Middlewares
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # Global Exception Handlers
    app.add_exception_handler(AppException, app_exception_handler)
    register_exception_handlers(app)

    # Register Feature Routers under /api/v1
    app.include_router(api_router, prefix=api_v1_prefix)
    app.include_router(feedback.router, prefix=api_v1_prefix)
    app.include_router(copilot.router, prefix=api_v1_prefix)
    app.include_router(ai_router, prefix=f"{api_v1_prefix}/ai", tags=["AI Subsystem"])
    app.include_router(projects.router, prefix=api_v1_prefix)
    app.include_router(analytics_router, prefix=f"{api_v1_prefix}/analytics", tags=["Analytics"])

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