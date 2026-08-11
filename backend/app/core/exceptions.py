"""
Core Application Exception Classes, AI/RAG Engine Exceptions, and Global Exception Handler.

Provides standardized application exceptions with HTTP status code mapping,
structlog integration, and global FastAPI error response formatting,
while maintaining 100% backwards compatibility across domain and AI layers.
"""

from typing import Any, Dict, List, Optional, Union
from fastapi import Request, status
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger(__name__)


class AppException(Exception):
    """Base application exception for all managed domain, AI, and operational errors."""

    def __init__(
        self,
        message: str = "An application error occurred.",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "INTERNAL_SERVER_ERROR",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        # Handle positional parameter swapping/flexibility across legacy call sites
        if isinstance(status_code, str) and isinstance(error_code, int):
            status_code, error_code = error_code, status_code
        elif isinstance(status_code, str):
            error_code = status_code
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


# Alias BaseAppException to AppException for base class interoperability
BaseAppException = AppException


# =========================================================================
# Standard HTTP & Web Exception Wrappers
# =========================================================================

class BadRequestException(AppException):
    """Raised when a request payload or parameter violates business constraints."""

    def __init__(
        self,
        message: str = "Invalid request or malformed syntax.",
        error_code: str = "BAD_REQUEST",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code=error_code,
            details=details,
        )


class UnauthorizedException(AppException):
    """Raised when authentication fails or credentials are missing/invalid."""

    def __init__(
        self,
        message: str = "Authentication credentials were missing or invalid.",
        error_code: str = "UNAUTHORIZED",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=error_code,
            details=details,
        )


class UnauthorizedAccessException(UnauthorizedException):
    """Alias for UnauthorizedException to support legacy access-layer calls."""

    def __init__(
        self,
        message: str = "Authentication credentials were invalid or missing.",
        error_code: str = "UNAUTHORIZED_ACCESS",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
        )


class ForbiddenException(AppException):
    """Raised when an authenticated client lacks permissions for an operation."""

    def __init__(
        self,
        message: str = "You do not have permission to perform this action.",
        error_code: str = "FORBIDDEN",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=error_code,
            details=details,
        )


class PermissionDeniedException(ForbiddenException):
    """Alias for ForbiddenException to support RBAC permission checks."""

    def __init__(
        self,
        message: str = "You do not have permission to perform this action.",
        error_code: str = "PERMISSION_DENIED",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
        )


class NotFoundException(AppException):
    """Raised when a requested domain entity or resource cannot be located."""

    def __init__(
        self,
        message: str = "The requested resource was not found.",
        error_code: str = "NOT_FOUND",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=error_code,
            details=details,
        )


class ResourceNotFoundException(NotFoundException):
    """Raised when a generic database record or resource is missing."""

    def __init__(
        self,
        message: str = "Requested resource not found.",
        error_code: str = "RESOURCE_NOT_FOUND",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
        )


class EntityNotFoundException(NotFoundException):
    """
    Raised when a specific database entity by name/id or general message is missing.
    Supports both EntityNotFoundException("User", 123) and EntityNotFoundException("User not found").
    """

    def __init__(
        self,
        entity_name_or_message: str = "The requested entity was not found.",
        entity_id_or_details: Any = None,
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        if entity_id_or_details is not None and not isinstance(
            entity_id_or_details, (dict, list)
        ):
            entity_name = entity_name_or_message
            entity_id = entity_id_or_details
            msg = f"{entity_name} with ID '{entity_id}' was not found."
            dtls = {"entity": entity_name, "id": str(entity_id)}
        else:
            msg = entity_name_or_message
            dtls = details or (
                entity_id_or_details
                if isinstance(entity_id_or_details, (dict, list))
                else {}
            )

        super().__init__(
            message=msg,
            error_code="ENTITY_NOT_FOUND",
            details=dtls,
        )


class ConflictException(AppException):
    """Raised when a resource creation/update conflicts with existing state (e.g., duplicate key)."""

    def __init__(
        self,
        message: str = "Resource conflict detected.",
        error_code: str = "CONFLICT",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code=error_code,
            details=details,
        )


class DuplicateEntityException(ConflictException):
    """Raised when unique constraint validation fails in repository layer."""

    def __init__(
        self,
        message: str = "Duplicate entity already exists.",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code="DUPLICATE_ENTITY",
            details=details,
        )


class ResourceConflictException(ConflictException):
    """Raised when a request conflicts with current server or database state."""

    def __init__(
        self,
        message: str = "Resource state conflict encountered.",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code="RESOURCE_CONFLICT",
            details=details,
        )


class UnprocessableEntityException(AppException):
    """Raised when a request is well-formed but cannot be processed due to semantic errors."""

    def __init__(
        self,
        message: str = "Unable to process the contained instructions.",
        error_code: str = "UNPROCESSABLE_ENTITY",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code=error_code,
            details=details,
        )


class ValidationAppException(UnprocessableEntityException):
    """Raised when domain business rules or request payload validations fail."""

    def __init__(
        self,
        message: str,
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class ValidationException(BadRequestException):
    """Raised when client input fails validation constraints."""

    def __init__(
        self,
        message: str = "Invalid request payload or parameters.",
        error_code: str = "VALIDATION_ERROR",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
        )


class ServiceUnavailableException(AppException):
    """Raised when an external dependency or service connection is temporarily down."""

    def __init__(
        self,
        message: str = "Service temporarily unavailable. Please retry later.",
        error_code: str = "SERVICE_UNAVAILABLE",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code=error_code,
            details=details,
        )


class ExternalServiceException(AppException):
    """
    Raised when a third-party API or external integration service fails.
    Supports both ExternalServiceException("Qdrant", "Timeout") and ExternalServiceException("Error message").
    """

    def __init__(
        self,
        service_name_or_message: str = "A downstream service error occurred.",
        message_or_details: Optional[Any] = None,
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        if isinstance(message_or_details, str):
            service_name = service_name_or_message
            msg = f"External integration error from {service_name}: {message_or_details}"
            dtls = {"service": service_name}
        else:
            msg = service_name_or_message
            dtls = details or (
                message_or_details
                if isinstance(message_or_details, (dict, list))
                else {}
            )

        super().__init__(
            message=msg,
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="EXTERNAL_SERVICE_ERROR",
            details=dtls,
        )


# =========================================================================
# AI Engine & Copilot / RAG Exceptions
# =========================================================================

class AIEngineError(AppException):
    """Base exception for all AI Copilot operations."""

    def __init__(
        self,
        message: str = "An error occurred during AI Copilot operations.",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "AI_ENGINE_ERROR",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status_code,
            error_code=error_code,
            details=details,
        )


class EmbeddingError(AIEngineError):
    """Raised when embedding generation fails."""

    def __init__(
        self,
        message: str = "Failed to generate text embeddings.",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="EMBEDDING_ERROR",
            details=details,
        )


class VectorDimensionMismatchError(AIEngineError):
    """Raised when query/document vector dimensions fail schema validation."""

    def __init__(
        self,
        message: str = "Query or document vector dimensions fail schema validation.",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="VECTOR_DIMENSION_MISMATCH",
            details=details,
        )


class VectorSearchError(AIEngineError):
    """Raised when Qdrant or vector DB retrieval operations fail."""

    def __init__(
        self,
        message: str = "Vector retrieval operation failed.",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="VECTOR_SEARCH_ERROR",
            details=details,
        )


class ContextAssemblyError(AIEngineError):
    """Raised when prompt construction fails."""

    def __init__(
        self,
        message: str = "Failed to assemble RAG prompt context.",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="CONTEXT_ASSEMBLY_ERROR",
            details=details,
        )


class ModelGenerationError(AIEngineError):
    """Raised during LLM generation or streaming operations."""

    def __init__(
        self,
        message: str = "LLM text generation or streaming failed.",
        details: Optional[Union[Dict[str, Any], List[Any]]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="MODEL_GENERATION_ERROR",
            details=details,
        )


# =========================================================================
# Global FastAPI Exception Handler Function
# =========================================================================

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Global FastAPI exception handler returning standardized API error responses."""
    request_id = getattr(request.state, "request_id", None)
    logger.warning(
        "Application exception intercepted",
        path=request.url.path,
        error_code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code,
        request_id=request_id,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error_code": exc.error_code,
            "message": exc.message,
            "details": exc.details,
            "request_id": request_id,
        },
    )