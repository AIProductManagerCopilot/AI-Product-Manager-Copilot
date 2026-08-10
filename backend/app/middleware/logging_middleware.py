"""
Request Logging & Correlation Middleware.

Handles request correlation ID (X-Request-ID) generation and propagation,
binds request state and structlog context variables, and logs execution timing
(X-Process-Time-MS) for incoming HTTP requests.
"""

import time
import uuid
from typing import Callable, Union

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
import structlog

logger = structlog.get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for correlation tracking, request duration measurement, and structured logging."""

    async def dispatch(
        self, request: Request, call_next: Union[Callable, RequestResponseEndpoint]
    ) -> Response:
        # 1. Clear context variables from previous requests in current execution context
        structlog.contextvars.clear_contextvars()

        # 2. Extract incoming X-Request-ID or generate a new correlation ID
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())

        # 3. Set request state for downstream FastAPI dependencies and endpoint handlers
        request.state.request_id = request_id

        # 4. Bind request metadata to structlog context for downstream application logs
        client_ip = request.client.host if request.client else "unknown"
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=client_ip,
            client_host=client_ip,
        )

        start_time = time.perf_counter()

        logger.info(
            "HTTP request started",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=client_ip,
        )

        try:
            response = await call_next(request)
            process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # 5. Inject response headers for client-side tracing and performance observability
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time-MS"] = f"{process_time_ms}ms"

            logger.info(
                "HTTP request completed",
                request_id=request_id,
                status_code=response.status_code,
                duration_ms=process_time_ms,
                process_time_ms=process_time_ms,
            )

            return response

        except Exception as exc:
            process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                "HTTP request failed with unhandled error",
                request_id=request_id,
                error=str(exc),
                error_type=exc.__class__.__name__,
                duration_ms=process_time_ms,
                process_time_ms=process_time_ms,
                exc_info=True,
            )
            raise exc