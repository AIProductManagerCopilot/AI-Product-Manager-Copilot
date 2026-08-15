"""
Analytics processing and clustering logic using Pandas.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import pandas as pd

from app.repositories.analytics_repository import AnalyticsRepository

# Documented mappings for deriving numeric scores in the analytics layer
SENTIMENT_MAPPING = {
    "positive": 0.8,
    "neutral": 0.0,
    "negative": -0.8,
}

PRIORITY_MAPPING = {
    "critical": 4.0,
    "high": 3.0,
    "medium": 2.0,
    "low": 1.0,
}


def _ensure_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Strip tzinfo so asyncpg can query timestamp without time zone columns cleanly."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt


def calculate_feature_priority_score(
    customer_demand_volume: int,
    avg_sentiment: float,
    priority_weight: float,
    impact_factor: float = 1.5,
) -> float:
    """
    Configurable feature prioritization scoring framework for PMs.
    Score = (Demand Volume * Impact Factor * Priority Weight) * (1 - Avg Sentiment)
    """
    base_score = customer_demand_volume * impact_factor * priority_weight
    sentiment_multiplier = 1.0 - avg_sentiment
    return round(base_score * sentiment_multiplier, 2)


async def get_theme_clusters_from_db(
    repo: AnalyticsRepository,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    project_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch and group feedback entries into theme clusters with weighted priority scores.
    """
    end_date = _ensure_naive_utc(end_date) or datetime.utcnow()
    start_date = _ensure_naive_utc(start_date) or (end_date - timedelta(days=365))

    rows = await repo.fetch_feedback_for_clustering(
        start_date=start_date,
        end_date=end_date,
        project_id=project_id,
    )

    if not rows:
        return []

    df = pd.DataFrame(rows)
    if df.empty or "feedback_type" not in df.columns:
        return []

    # Safe mapping of strings to numeric weights
    df["sentiment_score"] = (
        df["sentiment"].astype(str).str.lower().map(SENTIMENT_MAPPING).fillna(0.0)
    )
    df["severity_weight"] = (
        df["priority"].astype(str).str.lower().map(PRIORITY_MAPPING).fillna(1.0)
    )

    # Group by feedback_type
    grouped = (
        df.groupby("feedback_type")
        .agg(
            total_volume=("id", "count"),
            avg_sentiment=("sentiment_score", "mean"),
            avg_severity=("severity_weight", "mean"),
            representative_quotes=(
                "feedback_text",
                lambda x: [str(q) for q in x.dropna().head(3).tolist()],
            ),
        )
        .reset_index()
    )

    grouped["priority_score"] = (
        grouped["avg_severity"]
        * (1 - grouped["avg_sentiment"])
        * (grouped["total_volume"] ** 0.5)
    ).round(2)

    grouped = grouped.sort_values(by="priority_score", ascending=False)

    # Rename feedback_type to 'theme' for frontend API consistency
    grouped = grouped.rename(columns={"feedback_type": "theme"})

    return grouped.to_dict(orient="records")


async def get_trends(
    repo: AnalyticsRepository,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    project_id: Optional[str] = None,
    time_window_days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Compute volume aggregation trends over a given time window.
    """
    end_date = _ensure_naive_utc(end_date) or datetime.utcnow()
    start_date = _ensure_naive_utc(start_date) or (end_date - timedelta(days=time_window_days))

    rows = await repo.fetch_feedback_for_clustering(
        start_date=start_date,
        end_date=end_date,
        project_id=project_id,
    )

    if not rows:
        return []

    df = pd.DataFrame(rows)
    if df.empty or "created_at" not in df.columns:
        return []

    df["created_at"] = pd.to_datetime(df["created_at"])
    freq = "W" if time_window_days > 14 else "D"

    trend_data = (
        df.groupby(pd.Grouper(key="created_at", freq=freq))
        .size()
        .reset_index(name="volume")
    )

    trends = []
    for _, row in trend_data.iterrows():
        trends.append({
            "date": row["created_at"].strftime("%Y-%m-%d"),
            "volume": int(row["volume"]),
        })

    return trends


async def get_feature_request_analytics(
    repo: AnalyticsRepository,
    project_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Groups customer feature requests to expose demand volume, sentiment, and priority.
    """
    rows = await repo.fetch_feature_requests(project_id=project_id)
    if not rows:
        return {
            "total_feature_requests": 0,
            "high_priority_requests": 0,
            "avg_sentiment": 0.0,
            "top_requested_themes": [],
        }

    df = pd.DataFrame(rows)
    if df.empty:
        return {
            "total_feature_requests": 0,
            "high_priority_requests": 0,
            "avg_sentiment": 0.0,
            "top_requested_themes": [],
        }

    df["sentiment_score"] = (
        df["sentiment"].astype(str).str.lower().map(SENTIMENT_MAPPING).fillna(0.0)
    )
    df["severity_weight"] = (
        df["priority"].astype(str).str.lower().map(PRIORITY_MAPPING).fillna(1.0)
    )

    total_requests = len(df)
    high_priority_count = len(
        df[df["priority"].astype(str).str.lower().isin(["critical", "high"])]
    )
    avg_sentiment = (
        round(float(df["sentiment_score"].mean()), 2)
        if not df["sentiment_score"].empty
        else 0.0
    )

    return {
        "total_feature_requests": total_requests,
        "high_priority_requests": high_priority_count,
        "avg_sentiment": avg_sentiment,
        "top_requested_themes": [
            str(q) for q in df["feedback_text"].dropna().head(5).tolist()
        ],
    }