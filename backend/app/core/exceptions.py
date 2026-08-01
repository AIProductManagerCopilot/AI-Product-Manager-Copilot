"""
Core Domain & AI System Exception Hierarchy.

Provides standardized application exceptions with HTTP status code mapping,
while maintaining 100% backwards compatibility with Gagandeep's AI/RAG engine.
"""

from typing import Any, Dict, Optional
from fastapi import status


class AppException(Exception):
    """Base exception for all domain-specific application errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "INTERNAL_SERVER_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


# =========================================================================
# Web, Domain & Database Exceptions
# =========================================================================

class EntityNotFoundException(AppException):
    """Raised when a requested database entity or workspace resource is missing."""

    def __init__(self, entity_name: str, entity_id: Any) -> None:
        super().__init__(
            message=f"{entity_name} with ID '{entity_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="ENTITY_NOT_FOUND",
            details={"entity": entity_name, "id": str(entity_id)},
        )


class UnauthorizedAccessException(AppException):
    """Raised when authentication credentials are missing, expired, or invalid."""

    def __init__(self, message: str = "Invalid authentication credentials.") -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
        )


class PermissionDeniedException(AppException):
    """Raised when an authenticated user lacks required RBAC permissions."""

    def __init__(
        self, message: str = "Insufficient permissions to perform this action."
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="PERMISSION_DENIED",
        )


class DuplicateEntityException(AppException):
    """Raised when unique constraint validation fails in the repository layer."""

    def __init__(self, message: str) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code="DUPLICATE_ENTITY",
        )


class ValidationAppException(AppException):
    """Raised when domain business rules or request payload validations fail."""

    def __init__(
        self, message: str, details: Optional[Dict[str, Any]] = None
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class ExternalServiceException(AppException):
    """Raised when a third-party API or external integration service fails."""

    def __init__(self, service_name: str, message: str) -> None:
        super().__init__(
            message=f"External integration error from {service_name}: {message}",
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="EXTERNAL_SERVICE_ERROR",
            details={"service": service_name},
        )


# =========================================================================
# AI Engine & Copilot Exceptions (Gagandeep's RAG/AI Layer)
# =========================================================================

class AIEngineError(AppException):
    """Base exception for all AI Copilot operations."""

    def __init__(
        self,
        message: str = "An error occurred during AI Copilot operations.",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "AI_ENGINE_ERROR",
        details: Optional[Dict[str, Any]] = None,
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
        details: Optional[Dict[str, Any]] = None,
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
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="VECTOR_DIMENSION_MISMATCH",
            details=details,
        )


class VectorSearchError(AIEngineError):
    """Raised when Qdrant retrieval operations fail."""

    def __init__(
        self,
        message: str = "Qdrant vector retrieval operation failed.",
        details: Optional[Dict[str, Any]] = None,
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
        details: Optional[Dict[str, Any]] = None,
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
        message: str = "Gemini LLM text generation or streaming failed.",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="MODEL_GENERATION_ERROR",
            details=details,
        )