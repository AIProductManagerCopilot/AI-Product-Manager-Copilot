"""
Global Exception Handler Registrations for FastAPI.
Converts custom, validation, database, and system errors into standardized APIErrorResponse envelopes.
"""

import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import AppException
from app.schemas.common import APIErrorResponse, ErrorDetail

logger = structlog.get_logger(__name__)


def register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.warning(
            "Application Exception Caught",
            error_code=exc.error_code,
            message=exc.message,
            status_code=exc.status_code,
            request_id=request_id,
        )
        body = APIErrorResponse(
            success=False,
            error_code=exc.error_code,
            message=exc.message,
            details=[ErrorDetail(message=str(v)) for k, v in exc.details.items()] if exc.details else [],
            request_id=request_id,
        )
        return JSONResponse(status_code=exc.status_code, content=body.model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        errors = [
            ErrorDetail(
                field=" -> ".join(str(loc) for loc in err.get("loc", []) if loc != "body"),
                message=err.get("msg", "Invalid value"),
            )
            for err in exc.errors()
        ]
        logger.warning("Validation Error Caught", errors_count=len(errors), request_id=request_id)
        body = APIErrorResponse(
            success=False,
            error_code="VALIDATION_ERROR",
            message="Request body or parameter validation failed.",
            details=errors,
            request_id=request_id,
        )
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=body.model_dump())

    @app.exception_handler(SQLAlchemyError)
    async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.error("Database Driver Error Caught", error=str(exc), request_id=request_id, exc_info=True)
        body = APIErrorResponse(
            success=False,
            error_code="DATABASE_ERROR",
            message="A database operation error occurred. Details have been logged.",
            request_id=request_id,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=body.model_dump()
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.critical("Unhandled Critical Exception Caught", error=str(exc), request_id=request_id, exc_info=True)
        body = APIErrorResponse(
            success=False,
            error_code="INTERNAL_SERVER_ERROR",
            message="An unexpected server error occurred. Please contact support.",
            request_id=request_id,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=body.model_dump()
        )