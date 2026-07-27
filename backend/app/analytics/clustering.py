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
