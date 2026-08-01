"""
FastAPI Application Entrypoint and Lifecycle Configuration.

Integrates core domain routers, analytics engines, AI subsystems, security middleware,
correlation logging, and global exception handling.
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Force load the .env file explicitly from the directory root
load_dotenv()

# Initialize structured logging on application boot
from app.core.logging import setup_logging
setup_logging(json_format=False, log_level="INFO")

# Import custom production middlewares and global exception handlers
from app.middleware.error_handler import register_exception_handlers
from app.middleware.logging_middleware import RequestLoggingMiddleware
from app.middleware.security_middleware import SecurityHeadersMiddleware

# Import core application routers
from app.api.v1 import feedback
from app.api.v1 import copilot
from app.ai.router import router as ai_router
from app.api.v1 import projects
from app.api.v1.endpoints.analytics import router as analytics_router


def create_application() -> FastAPI:
    """Application factory for configuring and instantiating the FastAPI app."""
    app = FastAPI(
        title="AI Product Manager Copilot Backend API",
        description="Core backend analytics, AI ingestion pipeline engines, and workspace APIs",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # 1. Explicit allowed origins for Adnan's frontend local dev servers
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # 2. Enable CORS so React frontend can securely talk to this API
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time-MS"],
    )

    # 3. Custom Production Middlewares (Security & Correlation Logging)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # 4. Register Global Exception Handlers
    register_exception_handlers(app)

    # 5. Register Core Application Routers
    app.include_router(feedback.router, prefix="/api/v1")
    app.include_router(copilot.router, prefix="/api/v1")
    app.include_router(ai_router, prefix="/api/v1/ai", tags=["AI Subsystem"])
    app.include_router(projects.router, prefix="/api/v1")
    app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])

    return app


app = create_application()


@app.get("/", tags=["Health Check"])
def read_root():
    """Health check endpoint to verify backend server status and engine execution."""
    return {
        "status": "Online",
        "engine": "FastAPI on Docker isolated port 5433 (Gemini Engine Active)",
    }