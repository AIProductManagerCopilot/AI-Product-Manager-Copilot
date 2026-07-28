<<<<<<< HEAD
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any

async def get_theme_clusters_from_db(
    db: AsyncSession, 
    start_date: str = None, 
    end_date: str = None
) -> List[Dict[str, Any]]:
    """
    Fetches raw feedback from PostgreSQL and extracts theme clusters 
    and prioritized customer pain points.
    """
    # 1. Live SQL query to fetch raw feedback data
    query = text("""
        SELECT 
            id AS feedback_id,
            category,
            sentiment_score,
            severity_weight,
            content,
            created_at
        FROM customer_feedback
        WHERE (:start_date IS NULL OR created_at >= :start_date::timestamp)
          AND (:end_date IS NULL OR created_at <= :end_date::timestamp)
    """)
    
    result = await db.execute(query, {"start_date": start_date, "end_date": end_date})
    rows = result.mappings().all()
    
    if not rows:
        return []

    # 2. Convert database records to DataFrame
    df = pd.DataFrame(rows)

    # 3. Perform clustering & weighted priority calculation
    # Priority Score = Avg Severity Weight * (1 - Avg Sentiment Score) * Log(Volume)
    grouped = df.groupby('category').agg(
        total_volume=('feedback_id', 'count'),
        avg_sentiment=('sentiment_score', 'mean'),
        avg_severity=('severity_weight', 'mean')
    ).reset_index()

    grouped['priority_score'] = (
        grouped['avg_severity'] * (1 - grouped['avg_sentiment']) * (grouped['total_volume'] ** 0.5)
    ).round(2)

    # Sort by highest priority pain-points first
    grouped = grouped.sort_values(by='priority_score', ascending=False)

    return grouped.to_dict(orient='records')
=======
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
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
