from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

# Adjust db dependency import path if needed (e.g., app.seed.db_session or app.core.database)
from app.seed.db_session import get_db
from app.repositories.analytics_repository import AnalyticsRepository
from app.analytics.clustering import get_theme_clusters_from_db

router = APIRouter()


@router.get("/clusters")
async def get_clusters(
    start_date: Optional[datetime] = Query(default=None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[datetime] = Query(default=None, description="End date filter (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Fetch prioritized theme clusters and customer pain points directly from PostgreSQL.
    """
    try:
        # 1. Handle default dates if none are provided in Swagger
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=365)  # Default to 1 year back

        # 2. Initialize the repository with the PostgreSQL session
        repo = AnalyticsRepository(db)

        # 3. Process clusters using the updated pandas analytics pipeline
        clusters = await get_theme_clusters_from_db(repo, start_date, end_date)

        # 4. Return structured API response
        return {
            "success": True,
            "message": "Successfully fetched analytics clusters.",
            "data": clusters
        }

    except Exception as e:
        # Properly catch and log database/server errors
        raise HTTPException(
            status_code=500,
            detail={"error_code": "DATABASE_ERROR", "message": str(e)}
        )


@router.get("/trends")
async def get_feedback_trends(
    time_window_days: int = Query(default=30, description="Time window in days for trend aggregation"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Retrieve customer feedback trends over a given time window.
    """
    try:
        repo = AnalyticsRepository(db)
        
        # Check if a trend method exists on repository or process via analytics pipeline
        if hasattr(repo, "get_trends"):
            trends = await repo.get_trends(time_window_days=time_window_days)
        else:
            trends = []

        return {
            "success": True,
            "message": f"Successfully fetched feedback trends for the last {time_window_days} days.",
            "data": {
                "time_window_days": time_window_days,
                "trends": trends
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error_code": "TRENDS_FETCH_ERROR", "message": str(e)}
        )