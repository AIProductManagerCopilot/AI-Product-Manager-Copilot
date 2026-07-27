import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any

async def get_theme_trends_from_db(
    db: AsyncSession, 
    time_window_days: int = 30
) -> List[Dict[str, Any]]:
    """
    Fetches historical feedback trends grouped by category and time interval 
    from PostgreSQL to calculate trajectory vectors (rising, stable, falling).
    """
    # 1. SQL query to retrieve aggregated category volume over time intervals
    query = text("""
        SELECT 
            category,
            DATE_TRUNC('week', created_at) AS time_bucket,
            COUNT(id) AS volume,
            AVG(sentiment_score) AS avg_sentiment
        FROM customer_feedback
        WHERE created_at >= NOW() - (:days || ' days')::INTERVAL
        GROUP BY category, time_bucket
        ORDER BY category, time_bucket ASC
    """)
    
    result = await db.execute(query, {"days": time_window_days})
    rows = result.mappings().all()

    if not rows:
        return []

    df = pd.DataFrame(rows)
    df['time_bucket'] = df['time_bucket'].dt.strftime('%Y-%m-%d')

    # 2. Calculate trajectory trends per category
    trend_results = []
    for category, group in df.groupby('category'):
        volumes = group['volume'].tolist()
        
        # Determine trajectory direction
        if len(volumes) > 1:
            diff = volumes[-1] - volumes[0]
            trajectory = "rising" if diff > 0 else ("falling" if diff < 0 else "stable")
        else:
            trajectory = "stable"

        trend_results.append({
            "category": category,
            "trajectory": trajectory,
            "current_volume": volumes[-1] if volumes else 0,
            "history": group[['time_bucket', 'volume', 'avg_sentiment']].to_dict(orient='records')
        })

    return trend_results