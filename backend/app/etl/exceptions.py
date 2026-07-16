# backend/app/etl/exceptions.py

class ETLException(Exception):
    """Base exception class for all errors originating within the ETL engine."""
    def __init__(self, message: str, context: dict | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.context = context or {}


class SchemaValidationError(ETLException):
    """Raised when the record structure completely deviates from the invariant data contract. (e.g., missing critical keys, 
    incorrect root data primitive)."""
    pass


class RecordParsingError(ETLException):
    """Raised when a specific raw byte stream or text field cannot be converted into 
    its structural primitive (e.g., malformed CSV row, unparseable JSON block)."""
    pass


class DataValidationError(ETLException):
    """Raised when data types match the structural schema, but the field values 
    violate domain constraints (e.g., an empty content string, an out-of-bounds 
    severity index)."""
    pass