"""
Central API v1 Router Aggregator.

Combines endpoint routers for authentication, product management, and system
diagnostics into a unified API v1 router hierarchy.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, product, settings

api_router = APIRouter()

# Include feature domain routers
api_router.include_router(auth.router)
api_router.include_router(product.router)
api_router.include_router(settings.router)


@api_router.get("/health", tags=["System"])
async def api_health_check():
    """V1 API sub-health check endpoint."""
    return {"status": "ok", "version": "v1"}