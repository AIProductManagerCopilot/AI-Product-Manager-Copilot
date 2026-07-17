# tests/test_csv_pipeline.py

import os
import tempfile
import pytest
from backend.app.etl.csv_pipeline import CSVIngestionPipeline
from backend.app.etl.exceptions import DataValidationError

@pytest.fixture
def expected_headers():
    return ["user_id", "name", "score"]

def create_temp_csv(content: str) -> str:
    """Helper function to generate a temporary CSV file for testing."""
    temp_file = tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".csv", encoding="utf-8")
    temp_file.write(content.strip())
    temp_file.close()
    return temp_file.name

def test_pipeline_success_path(expected_headers):
    """Verifies that clean, valid data parses perfectly and updates telemetry."""
    csv_data = """user_id,name,score
101,Alice,85.5
102,Bob,92.0
"""
    file_path = create_temp_csv(csv_data)
    
    try:
        pipeline = CSVIngestionPipeline(expected_headers=expected_headers)
        
        # 1. Test streaming extraction
        chunks = list(pipeline.extract_chunks(file_path, chunk_size=1))
        assert len(chunks) == 2  # 2 rows split into chunks of 1
        
        # 2. Test validation and normalization logic
        raw_record = chunks[0][0]
        validated = pipeline.validate_record(raw_record)
        normalized = pipeline.normalize_record(validated)
        
        assert normalized["user_id"] == "101"
        assert normalized["name"] == "Alice"
        assert pipeline.telemetry.records_processed == 1
        assert pipeline.telemetry.records_rejected == 0
        
    finally:
        os.unlink(file_path)

def test_pipeline_missing_schema_column(expected_headers):
    """Verifies that missing structural columns trigger a structural error immediately."""
    # Missing the required 'score' column entirely
    corrupt_csv = """user_id,name
101,Alice
"""
    file_path = create_temp_csv(corrupt_csv)
    
    try:
        pipeline = CSVIngestionPipeline(expected_headers=expected_headers)
        with pytest.raises(DataValidationError, match="Missing required column"):
            list(pipeline.extract_chunks(file_path))
            
    finally:
        os.unlink(file_path)

def test_pipeline_invalid_record_score(expected_headers):
    """Verifies that out-of-bounds metrics are caught and captured in telemetry summaries."""
    pipeline = CSVIngestionPipeline(expected_headers=expected_headers)
    
    # Score is out of the 0-100 product boundary rule
    bad_record = {"user_id": "103", "name": "Charlie", "score": "150.0"}
    
    with pytest.raises(DataValidationError):
        pipeline.validate_record(bad_record)
        
    # Telemetry must show 1 processed record and 1 rejected error capture
    assert pipeline.telemetry.records_processed == 1
    assert pipeline.telemetry.records_rejected == 1
    assert len(pipeline.telemetry.error_summary["Validation Errors"]) == 1