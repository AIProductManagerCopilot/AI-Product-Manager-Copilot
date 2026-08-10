from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

# Adjust db dependency import path if needed
from app.seed.db_session import get_db
from app.repositories.analytics_repository import AnalyticsRepository

from app.analytics.clustering import (
    get_theme_clusters_from_db, 
    get_trends, 
    get_feature_request_analytics
)

router = APIRouter()

@router.get("/clusters")
async def get_clusters(
    project_id: Optional[str] = Query(default=None, description="Filter by PM workspace project ID"),
    start_date: Optional[datetime] = Query(default=None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[datetime] = Query(default=None, description="End date filter (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Fetch prioritized theme clusters and customer pain points directly from PostgreSQL.
    Upgraded for Milestone 4: Scoped to PM workspace (project_id).
    """
    try:
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=365)  

        repo = AnalyticsRepository(db)
        clusters = await get_theme_clusters_from_db(repo, start_date, end_date, project_id)

        return {
            "success": True,
            "message": "Successfully fetched analytics clusters.",
            "data": clusters
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error_code": "DATABASE_ERROR", "message": str(e)}
        )


@router.get("/trends")
async def get_feedback_trends(
    project_id: Optional[str] = Query(default=None, description="Filter by PM workspace project ID"),
    time_window_days: int = Query(default=30, description="Time window in days for trend aggregation"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Retrieve customer feedback trends over a given time window.
    Upgraded for Milestone 4: Uses pandas aggregation pipeline and single PM scope.
    """
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=time_window_days)

        repo = AnalyticsRepository(db)
        
        trends = await get_trends(
            repo=repo, 
            start_date=start_date, 
            end_date=end_date, 
            project_id=project_id, 
            time_window_days=time_window_days
        )

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


@router.get("/executive-summary")
async def get_executive_summary(
    project_id: Optional[str] = Query(default=None, description="Filter by PM workspace project ID"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generates an executive summary payload for product strategy reporting and AI context.
    """
    try:
        repo = AnalyticsRepository(db)
        
        # 1. Fetch system KPIs
        kpis = await repo.fetch_kpi_summary_metrics()
        
        # 2. Fetch top pain points
        clusters = await get_theme_clusters_from_db(repo, project_id=project_id)
        top_pain_points = clusters[:3] if clusters else []
        
        # 3. Fetch feature request demand
        feature_demand = await get_feature_request_analytics(repo, project_id=project_id)

        return {
            "success": True,
            "message": "Successfully generated executive summary analytics.",
            "data": {
                "kpis": kpis,
                "top_pain_points": top_pain_points,
                "feature_request_demand": feature_demand
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error_code": "EXECUTIVE_SUMMARY_ERROR", "message": str(e)}
        )