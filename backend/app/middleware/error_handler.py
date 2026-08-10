"""
Global Exception Handling Middleware & Registration.

Provides standardized JSON error responses across the application for custom business exceptions,
validation failures, database driver errors, Starlette HTTP exceptions, and unhandled 500 server errors.
"""

from typing import Any, Dict, List, Optional, Union
import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = structlog.get_logger(__name__)


# ------------------------------------------------------------------------------
# Custom Application Exception Hierarchy
# ------------------------------------------------------------------------------

class AppException(Exception):
    """Base exception class for application-specific business logic errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        code: str = "BAD_REQUEST",
        error_code: Optional[str] = None,
        details: Optional[Union[List[Any], Dict[str, Any]]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.code = error_code or code
        self.details = details or []
        super().__init__(message)

    @property
    def error_code(self) -> str:
        """Alias for compatibility across error response schemas."""
        return self.code


class NotFoundException(AppException):
    """Raised when a requested database record or entity cannot be found."""

    def __init__(
        self,
        message: str = "Resource not found",
        details: Optional[Union[List[Any], Dict[str, Any]]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            details=details,
        )


class UnauthorizedException(AppException):
    """Raised when authentication fails or credentials are missing."""

    def __init__(
        self,
        message: str = "Authentication required",
        details: Optional[Union[List[Any], Dict[str, Any]]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            details=details,
        )


class ForbiddenException(AppException):
    """Raised when an authenticated user lacks required permissions for a resource."""

    def __init__(
        self,
        message: str = "Access denied",
        details: Optional[Union[List[Any], Dict[str, Any]]] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
            details=details,
        )


# ------------------------------------------------------------------------------
# Response Envelope Helper
# ------------------------------------------------------------------------------

def _build_error_response(
    request: Request,
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[List[Dict[str, Any]]] = None,
) -> JSONResponse:
    """Helper to construct uniform APIErrorResponse JSON envelopes with request correlation IDs."""
    request_id = getattr(request.state, "request_id", None)
    payload = {
        "success": False,
        "error_code": error_code,
        "message": message,
        "details": details or [],
        "request_id": request_id,
    }
    return JSONResponse(status_code=status_code, content=payload)


# ------------------------------------------------------------------------------
# Global Exception Handler Registration
# ------------------------------------------------------------------------------

def register_exception_handlers(app: FastAPI) -> None:
    """Registers application-wide exception handlers with the FastAPI instance."""

    # 1. Custom Domain Application Exceptions
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.warning(
            "Application Exception Caught",
            error_code=exc.error_code,
            message=exc.message,
            status_code=exc.status_code,
            path=request.url.path,
            request_id=request_id,
        )

        formatted_details: List[Dict[str, Any]] = []
        if isinstance(exc.details, dict):
            formatted_details = [
                {"field": str(k), "message": str(v)} for k, v in exc.details.items()
            ]
        elif isinstance(exc.details, list):
            for d in exc.details:
                if isinstance(d, dict):
                    formatted_details.append({
                        "field": str(d.get("field")) if "field" in d else None,
                        "message": str(d.get("message", d)),
                    })
                else:
                    formatted_details.append({"message": str(d)})

        return _build_error_response(
            request=request,
            status_code=exc.status_code,
            error_code=exc.error_code,
            message=exc.message,
            details=formatted_details,
        )

    # 2. FastAPI Request Payload & Parameter Validation (422)
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        errors = []
        for err in exc.errors():
            loc_parts = [str(x) for x in err.get("loc", []) if str(x) != "body"]
            field_name = " -> ".join(loc_parts) if loc_parts else None
            errors.append({
                "field": field_name,
                "message": err.get("msg", "Invalid field value"),
                "type": err.get("type"),
            })

        logger.warning(
            "Validation Error Caught",
            path=request.url.path,
            errors_count=len(errors),
            request_id=request_id,
        )

        return _build_error_response(
            request=request,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            message="Request body or parameter validation failed.",
            details=errors,
        )

    # 3. Starlette / FastAPI Standard HTTP Exceptions (400, 401, 403, 404, etc.)
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.warning(
            "HTTP Exception Caught",
            path=request.url.path,
            status_code=exc.status_code,
            detail=exc.detail,
            request_id=request_id,
        )

        return _build_error_response(
            request=request,
            status_code=exc.status_code,
            error_code=f"HTTP_{exc.status_code}",
            message=str(exc.detail),
        )

    # 4. SQLAlchemy / Database Driver Exception Handler (500)
    @app.exception_handler(SQLAlchemyError)
    async def database_exception_handler(
        request: Request, exc: SQLAlchemyError
    ) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.error(
            "Database Driver Error Caught",
            path=request.url.path,
            error=str(exc),
            request_id=request_id,
            exc_info=True,
        )

        return _build_error_response(
            request=request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DATABASE_ERROR",
            message="A database operation error occurred. Details have been logged.",
        )

    # 5. Fallback Handler for Unhandled Native Exceptions (500)
    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.critical(
            "Unhandled Critical Exception Caught",
            path=request.url.path,
            error=str(exc),
            error_type=exc.__class__.__name__,
            request_id=request_id,
            exc_info=True,
        )

        return _build_error_response(
            request=request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="INTERNAL_SERVER_ERROR",
            message="An unexpected server error occurred. Please contact support.",
        )