# backend/app/analytics/clustering.py

from typing import List, Dict, Any
from pydantic import BaseModel, Field

class ClusterItem(BaseModel):
    """Represents a single grouped category or theme of feedback."""
    name: str = Field(..., frozen=True, description="The name of the feature or category cluster")
    count: int = Field(..., frozen=True, description="Total number of items in this cluster")
    priority_score: float = Field(..., frozen=True, description="Weighted business priority based on volume and severity")
    sample_records: List[Dict[str, Any]] = Field(..., frozen=True, description="A small subset of records belonging to this cluster")

class FeatureClusteringEngine:
    """Stateless algorithmic processor that groups feedback records into feature clusters."""

    @staticmethod
    def cluster_by_category(records: List[Dict[str, Any]], sample_limit: int = 3) -> List[ClusterItem]:
        """
        Groups normalized records by their category/theme tag and computes a weighted priority score.
        High severity (e.g., 'high', 'critical') boosts the priority score weight.
        """
        raw_clusters: Dict[str, Dict[str, Any]] = {}

        # Severity weight mapping to scale business priority
        severity_weights = {"high": 2.0, "critical": 3.0, "medium": 1.5, "low": 1.0}

        for record in records:
            category = record.get("category", "unassigned").lower().strip()
            severity = record.get("severity", "low").lower().strip()
            weight = severity_weights.get(severity, 1.0)

            if category not in raw_clusters:
                raw_clusters[category] = {
                    "count": 0,
                    "weighted_sum": 0.0,
                    "records": []
                }

            raw_clusters[category]["count"] += 1
            raw_clusters[category]["weighted_sum"] += weight
            
            if len(raw_clusters[category]["records"]) < sample_limit:
                raw_clusters[category]["records"].append(record)

        # Convert raw dict groups into structured, frozen Pydantic payloads
        output_clusters: List[ClusterItem] = []
        for name, data in raw_clusters.items():
            # Priority Score = (Weighted Severity Sum / Total Records in Cluster) * Log-scaled or linear count factor
            # For simplicity and clear calculation: average weight multiplied by count
            avg_weight = data["weighted_sum"] / data["count"]
            computed_priority = round(avg_weight * data["count"], 2)

            output_clusters.append(ClusterItem(
                name=name,
                count=data["count"],
                priority_score=computed_priority,
                sample_records=data["records"]
            ))

        # Sort clusters by priority score descending so critical issues bubble up first
        return sorted(output_clusters, key=lambda x: x.priority_score, reverse=True)