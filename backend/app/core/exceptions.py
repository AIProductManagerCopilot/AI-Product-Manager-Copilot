class AIEngineError(Exception):
    """Base exception for all AI Copilot operations."""
    pass

class EmbeddingError(AIEngineError):
    """Raised when embedding generation fails."""
    pass

class VectorDimensionMismatchError(AIEngineError):
    """Raised when query/document vector dimensions fail schema validation."""
    pass

class VectorSearchError(AIEngineError):
    """Raised when Qdrant retrieval operations fail."""
    pass

class ContextAssemblyError(AIEngineError):
    """Raised when prompt construction fails."""
    pass

class ModelGenerationError(AIEngineError):
    """Raised during LLM generation or streaming operations."""
<<<<<<< HEAD
    pass
=======
    pass
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
