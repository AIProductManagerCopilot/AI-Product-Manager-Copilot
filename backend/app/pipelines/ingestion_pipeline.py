# backend/app/pipelines/ingestion_pipeline.py

import logging
import time
from typing import Dict, Any, List, Tuple
from backend.app.etl.csv_pipeline import CSVETLPipeline
from backend.app.analytics.metrics import AnalyticsEngine, MetricsResult
from backend.app.etl.base import PipelineTelemetry

logger = logging.getLogger("pipelines.ingestion_orchestrator")

class IngestionOrchestrator:
    """
    Orchestrates the complete data engineering lifecycle.
    Streams raw data assets, handles validation, and extracts aggregated metrics
    to be consumed by Teammate 2's API routing layer and the Team Lead's AI layer.
    """

    def __init__(self, required_columns: List[str], chunk_size: int = 1000):
        self.pipeline = CSVETLPipeline(required_columns=required_columns, chunk_size=chunk_size)
        self.required_columns = required_columns

    def execute_ingestion_session(self, file_path: str) -> Tuple[List[Dict[str, Any]], MetricsResult, PipelineTelemetry]:
        """
        Executes a complete end-to-end extraction, transformation, and aggregation run.
        Returns the flat list of all normalized records, calculated metrics, and execution telemetry.
        """
        start_time = time.perf_counter()
        all_normalized_records: List[Dict[str, Any]] = []
        
        # Instantiate execution stream
        batch_generator = self.pipeline.process(file_path)
        
        telemetry: PipelineTelemetry = None
        try:
            while True:
                try:
                    # Pull micro-batches sequentially from the streaming engine
                    chunk = next(batch_generator)
                    all_normalized_records.extend(chunk)
                except StopIteration as stop_event:
                    # Capture the final PipelineTelemetry returned by the generator exit
                    telemetry = stop_event.value
                    break
        except Exception as global_ex:
            logger.critical(f"Unhandled fault during orchestration stream: {str(global_ex)}")
            duration = time.perf_counter() - start_time
            return [], MetricsResult(total_volume=0, source_distribution={}, severity_distribution={}, processing_efficiency_eps=0.0), PipelineTelemetry(
                execution_duration_sec=round(duration, 4),
                records_processed=0,
                records_rejected=0,
                error_count=1,
                error_summary=[f"Orchestration critical failure: {str(global_ex)}"]
            )

        # Compute stateless metrics summaries over all successfully processed records
        total_duration = time.perf_counter() - start_time
        metrics = AnalyticsEngine.compute_batch_metrics(all_normalized_records, total_duration)
        
        logger.info(f"Pipeline execution completed successfully. Ingested: {telemetry.records_processed} rows.")
        return all_normalized_records, metrics, telemetry