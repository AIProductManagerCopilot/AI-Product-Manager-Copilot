"""
Security Headers Middleware.

Injects production-grade HTTP security headers into all outgoing responses
to protect against XSS, clickjacking, MIME-sniffing, context leaking, and protocol downgrade attacks.
"""

from typing import Callable, Union

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for injecting standard security response headers into outgoing responses."""

    async def dispatch(
        self, request: Request, call_next: Union[Callable, RequestResponseEndpoint]
    ) -> Response:
        response = await call_next(request)

        # 1. Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # 2. Guard against clickjacking attacks by forbidding iframe embedding
        response.headers["X-Frame-Options"] = "DENY"

        # 3. Enable legacy browser XSS protection filtering
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # 4. Control referrer information passed during cross-origin requests
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 5. Disable sensitive browser features and hardware APIs by default
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), payment=()"
        )

        # 6. Enforce Strict-Transport-Security (HSTS) with reverse-proxy scheme awareness
        is_https = (
            request.url.scheme == "https"
            or request.headers.get("x-forwarded-proto") == "https"
        )
        if is_https:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        else:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        return response