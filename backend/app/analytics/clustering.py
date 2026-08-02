import pandas as pd
from typing import List, Dict, Any
from app.repositories.analytics_repository import AnalyticsRepository


async def get_theme_clusters_from_db(
    repo: AnalyticsRepository, 
    start_date: Any = None, 
    end_date: Any = None
) -> List[Dict[str, Any]]:
    """
    Fetches raw feedback using AnalyticsRepository and extracts theme clusters 
    and prioritized customer pain points using Pandas.
    """
    # 1. Fetch clean feedback data from PostgreSQL repository (Async await)
    rows = await repo.fetch_feedback_for_clustering(start_date, end_date)
    
    if not rows:
        return []

    # 2. Convert database records to DataFrame
    df = pd.DataFrame(rows)

    # 3. Perform clustering & weighted priority calculation
    # Priority Score = Avg Severity Weight * (1 - Avg Sentiment Score) * Log/Sqrt(Volume)
    grouped = df.groupby('category').agg(
        total_volume=('id', 'count'),
        avg_sentiment=('sentiment_score', 'mean'),
        avg_severity=('severity_weight', 'mean')
    ).reset_index()

    grouped['priority_score'] = (
        grouped['avg_severity'] * (1 - grouped['avg_sentiment']) * (grouped['total_volume'] ** 0.5)
    ).round(2)

    # Sort by highest priority pain-points first
    grouped = grouped.sort_values(by='priority_score', ascending=False)

    return grouped.to_dict(orient='records')