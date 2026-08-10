"""
Global FastAPI Exception Handlers.

Registers application-wide exception handlers to intercept domain exceptions
(AppException), Pydantic request validation errors, and unhandled server errors,
formatting them into standardized APIErrorResponse payloads.
"""

import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import AppException
from app.schemas.common import APIErrorResponse, ErrorDetail

logger = structlog.get_logger(__name__)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handles custom application domain exceptions (AppException)."""
    logger.warning(
        "Application domain exception occurred",
        path=request.url.path,
        error_code=exc.error_code,
        status_code=exc.status_code,
        message=exc.message,
    )
    response_data = APIErrorResponse(
        success=False,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=response_data.model_dump(),
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handles Pydantic request body and parameters validation errors."""
    details = []
    for error in exc.errors():
        field_path = ".".join(str(loc) for loc in error.get("loc", []))
        details.append(
            ErrorDetail(
                field=field_path,
                error_code="VALIDATION_ERROR",
                type=error.get("type"),
                message=error.get("msg", "Validation error"),
            )
        )

    logger.warning(
        "Request validation failure",
        path=request.url.path,
        errors_count=len(details),
    )
    response_data = APIErrorResponse(
        success=False,
        error_code="VALIDATION_ERROR",
        message="Request parameter or payload validation failed.",
        details=details,
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response_data.model_dump(),
    )


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Handles standard Starlette / FastAPI HTTPExceptions."""
    logger.warning(
        "HTTP exception occurred",
        path=request.url.path,
        status_code=exc.status_code,
        detail=str(exc.detail),
    )
    response_data = APIErrorResponse(
        success=False,
        error_code="HTTP_ERROR",
        message=str(exc.detail),
        details=[],
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=response_data.model_dump(),
    )


async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Fallback handler for unhandled internal server exceptions."""
    logger.error(
        "Unhandled internal server error",
        path=request.url.path,
        error=str(exc),
        exc_info=True,
    )
    response_data = APIErrorResponse(
        success=False,
        error_code="INTERNAL_SERVER_ERROR",
        message="An unexpected internal server error occurred.",
        details=[],
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response_data.model_dump(),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Registers all custom exception handlers on the FastAPI application instance."""
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)