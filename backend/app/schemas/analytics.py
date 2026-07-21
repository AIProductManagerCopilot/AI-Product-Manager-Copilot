# backend/app/schemas/analytics.py
from pydantic import BaseModel
from typing import List, Optional

class ClusterResponse(BaseModel):
    name: str
    count: int
    priority_score: float
    sample_feedback: List[str] = []

class TrendResponse(BaseModel):
    category: str
    current_count: int
    previous_count: int
    growth_rate_pct: float
    trajectory: str  # "rising", "stable", or "falling"

class AnalyticsOverview(BaseModel):
    clusters: List[ClusterResponse]
    trends: List[TrendResponse]