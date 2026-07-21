# backend/app/analytics/trends.py

from typing import List, Dict, Any
from pydantic import BaseModel, Field

class TrendVector(BaseModel):
    """Represents the operational trajectory of a feedback category."""
    category: str = Field(..., frozen=True)
    current_period_count: int = Field(..., frozen=True)
    previous_period_count: int = Field(..., frozen=True)
    growth_rate_pct: float = Field(..., frozen=True, description="Percentage change between periods")
    trajectory: str = Field(..., frozen=True, description="'rising', 'stable', or 'falling'")

class TrendAnalysisEngine:
    """Stateless processor that calculates rolling growth vectors over split data sets."""

    @staticmethod
    def calculate_growth_trends(
        current_period_records: List[Dict[str, Any]], 
        previous_period_records: List[Dict[str, Any]]
    ) -> List[TrendVector]:
        """
        Compares two distinct batches of time-series data (e.g., Week 2 vs Week 1)
        and outputs velocity trend lines for Teammate 3's front-end charts.
        """
        current_counts: Dict[str, int] = {}
        previous_counts: Dict[str, int] = {}

        # Aggregate current bucket volumes
        for r in current_period_records:
            cat = r.get("category", "unassigned").lower().strip()
            current_counts[cat] = current_counts.get(cat, 0) + 1

        # Aggregate historical baseline bucket volumes
        for r in previous_period_records:
            cat = r.get("category", "unassigned").lower().strip()
            previous_counts[cat] = previous_counts.get(cat, 0) + 1

        all_categories = set(current_counts.keys()).union(set(previous_counts.keys()))
        trends: List[TrendVector] = []

        for cat in all_categories:
            current_val = current_counts.get(cat, 0)
            previous_val = previous_counts.get(cat, 0)

            # Calculate growth rate percentage safely
            if previous_val == 0:
                growth_rate = 100.0 if current_val > 0 else 0.0
            else:
                growth_rate = round(((current_val - previous_val) / previous_val) * 100, 2)

            # Assign text-based trajectory vector tags
            if growth_rate > 10.0:
                trajectory = "rising"
            elif growth_rate < -10.0:
                trajectory = "falling"
            else:
                trajectory = "stable"

            trends.append(TrendVector(
                category=cat,
                current_period_count=current_val,
                previous_period_count=previous_val,
                growth_rate_pct=growth_rate,
                trajectory=trajectory
            ))

        # Sort by highest growth rate percentage descending
        return sorted(trends, key=lambda x: x.growth_rate_pct, reverse=True)