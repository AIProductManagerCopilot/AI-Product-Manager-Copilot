"""
Middleware for Request Correlation Tracking, Duration Measurement, and Structured Logging.
"""

import time
import uuid
import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = structlog.get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = request.headers.get("X-Request-ID", f"req_{uuid.uuid4().hex[:12]}")
        request.state.request_id = request_id

        start_time = time.perf_counter()

        logger.info(
            "HTTP Request Received",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host if request.client else "unknown",
        )

        try:
            response = await call_next(request)
            process_time_ms = (time.perf_counter() - start_time) * 1000

            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time-MS"] = f"{process_time_ms:.2f}"

            logger.info(
                "HTTP Response Dispatched",
                request_id=request_id,
                status_code=response.status_code,
                duration_ms=round(process_time_ms, 2),
            )
            return response

        except Exception as exc:
            process_time_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Unhandled Exception in Processing",
                request_id=request_id,
                error=str(exc),
                duration_ms=round(process_time_ms, 2),
                exc_info=True,
            )
            raise exc