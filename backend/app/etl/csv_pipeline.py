# backend/app/etl/csv_pipeline.py

import csv
import time
from typing import Generator, Dict, Any, List
from backend.app.etl.base import BaseETLPipeline, PipelineTelemetry
from backend.app.etl.exceptions import DataValidationError

class CSVIngestionPipeline(BaseETLPipeline):
    """
    Concrete implementation of BaseETLPipeline for streaming, 
    validating, and normalizing CSV data assets.
    """

    def __init__(self, expected_headers: List[str]) -> None:
        # Standardize expected headers to lowercase, stripped strings
        self.expected_headers = [h.lower().strip() for h in expected_headers]
        self.telemetry = PipelineTelemetry()

    def extract_chunks(
        self, 
        source_path: str, 
        chunk_size: int = 1000
    ) -> Generator[List[Dict[str, Any]], None, None]:
        """Lazily reads a CSV file line-by-line and yields row dictionaries in chunks."""
        start_time = time.perf_counter()
        
        try:
            with open(source_path, mode="r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                
                if reader.fieldnames is None:
                    raise DataValidationError("The uploaded CSV file is empty or missing a header row.")
                
                # Verify structural integrity (Schema Check)
                actual_headers = [h.lower().strip() for h in reader.fieldnames]
                for req_header in self.expected_headers:
                    if req_header not in actual_headers:
                        err_msg = f"Missing required column: '{req_header}'"
                        self.telemetry.mark_rejected("Schema Errors", err_msg)
                        raise DataValidationError(err_msg)

                # Stream rows in chunks to preserve memory metrics
                chunk: List[Dict[str, Any]] = []
                for row in reader:
                    chunk.append(row)
                    if len(chunk) >= chunk_size:
                        yield chunk
                        chunk = []
                
                if chunk:
                    yield chunk

        finally:
            self.telemetry.execution_duration_sec = round(time.perf_counter() - start_time, 4)

    def validate_record(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        """Validates critical business boundaries on single records."""
        self.telemetry.records_processed += 1
        
        # Check for empty identifiers (Product Requirement)
        user_id = raw_record.get("user_id") or raw_record.get("User_ID")
        if not user_id or not str(user_id).strip():
            err_msg = "Record rejected: Missing unique identity attribute 'user_id'."
            self.telemetry.mark_rejected("Validation Errors", err_msg)
            raise DataValidationError(err_msg)

        # Ensure numeric values are bounded properly if provided
        score_val = raw_record.get("score") or raw_record.get("Score")
        if score_val is not None and str(score_val).strip() != "":
            try:
                score = float(score_val)
                if score < 0 or score > 100:
                    raise ValueError()
            except ValueError:
                err_msg = f"Record {user_id} rejected: Invalid score threshold '{score_val}'."
                self.telemetry.mark_rejected("Validation Errors", err_msg)
                raise DataValidationError(err_msg)

        return raw_record

    def normalize_record(self, validated_record: Dict[str, Any]) -> Dict[str, Any]:
        """Cleans and normalizes records into uniform primitives."""
        normalized = {}
        for key, val in validated_record.items():
            clean_key = key.lower().strip()
            clean_val = val.strip() if isinstance(val, str) else val
            normalized[clean_key] = clean_val
        return normalized