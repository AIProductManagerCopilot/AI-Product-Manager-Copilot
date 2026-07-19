# backend/app/analytics/metrics.py

from typing import List, Dict, Any
from pydantic import BaseModel, Field

class MetricsResult(BaseModel):
    """
    Strongly typed, completely immutable container for pipeline analytics.
    Exposed to Teammate 2 (API) and Teammate 3 (Frontend views).
    """
    total_volume: int = Field(..., description="Total number of records aggregated")
    source_distribution: Dict[str, int] = Field(..., description="Frequency count of feedback platforms")
    severity_distribution: Dict[str, int] = Field(..., description="Frequency count of severity levels")
    processing_efficiency_eps: float = Field(..., description="Events processed per second")

    class Config:
        # Enforces absolute immutability matching production guardrails
        frozen = True

class AnalyticsEngine:
    """
    Stateless processing service that computes rolling metrics summaries 
    over normalized records without persisting data directly.
    """
    
    @staticmethod
    def compute_batch_metrics(records: List[Dict[str, Any]], execution_time_sec: float) -> MetricsResult:
        """
        Aggregates a batch of normalized records in a single pass.
        Time Complexity: O(N) | Space Complexity: O(K) where K is unique categories.
        """
        total_volume = len(records)
        source_counts: Dict[str, int] = {}
        severity_counts: Dict[str, int] = {}
        
        for record in records:
            # Aggregate platform sources safely (e.g., mobile, web, email)
            source = str(record.get("source", "unknown")).lower().strip()
            source_counts[source] = source_counts.get(source, 0) + 1
            
            # Aggregate business severity levels safely (e.g., high, medium, low)
            severity = str(record.get("severity", "unassigned")).lower().strip()
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
        # Calculate pipeline throughput (Events Per Second)
        efficiency = 0.0
        if execution_time_sec > 0:
            efficiency = round(total_volume / execution_time_sec, 2)
            
        return MetricsResult(
            total_volume=total_volume,
            source_distribution=source_counts,
            severity_distribution=severity_counts,
            processing_efficiency_eps=efficiency
        )