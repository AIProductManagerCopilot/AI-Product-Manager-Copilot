# backend/app/etl/base.py

import abc
from typing import Generator, Dict, Any, List
from pydantic import BaseModel, Field

class PipelineTelemetry(BaseModel):
    """
    Captures deterministic pipeline runtime statistics for system observability.
    This lets us monitor how many rows succeeded, failed, or threw warnings.
    """
    execution_duration_sec: float = Field(0.0, description="Duration of pipeline execution in seconds")
    records_processed: int = Field(0, description="Total records processed")
    records_rejected: int = Field(0, description="Total records failing validation")
    warning_count: int = Field(0, description="Recoverable validation warnings")
    error_count: int = Field(0, description="Fatal parsing or structural error counts")
    error_summary: Dict[str, List[str]] = Field(
        default_factory=lambda: {
            "Schema Errors": [],
            "Parsing Errors": [],
            "Validation Errors": []
        },
        description="Categorized sample of validation error messages"
    )

    def mark_rejected(self, category: str, error_message: str) -> None:
        """Increments error counts and records a sample error message."""
        self.records_rejected += 1
        self.error_count += 1
        if category in self.error_summary:
            if len(self.error_summary[category]) < 10:  # Cap to save memory footprints
                self.error_summary[category].append(error_message)


class BaseETLPipeline(abc.ABC):
    """
    Abstract Base Class contract for memory-efficient, chunk-based streaming pipelines.
    Every database or file pipeline we build must implement these three methods.
    """

    @abc.abstractmethod
    def extract_chunks(
        self, 
        source_path: str, 
        chunk_size: int = 1000
    ) -> Generator[List[Dict[str, Any]], None, None]:
        """Lazily reads the source file in chunks to protect memory budgets."""
        pass

    @abc.abstractmethod
    def validate_record(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        """Validates basic structure, fields, and constraints of a raw record."""
        pass

    @abc.abstractmethod
    def normalize_record(self, validated_record: Dict[str, Any]) -> Dict[str, Any]:
        """Coerces record values into unified standard primitives."""
        pass