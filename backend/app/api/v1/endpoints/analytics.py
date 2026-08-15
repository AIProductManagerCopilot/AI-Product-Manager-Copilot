"""
API Endpoints for Feedback Analytics and Theme Clustering.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.core.database import get_db
from app.repositories.analytics_repository import AnalyticsRepository
from app.analytics.clustering import (
    get_theme_clusters_from_db,
    get_trends,
    get_feature_request_analytics,
)

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/clusters", status_code=status.HTTP_200_OK)
async def get_clusters(
    project_id: Optional[str] = Query(default=None, description="Filter by PM workspace project ID"),
    start_date: Optional[datetime] = Query(default=None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[datetime] = Query(default=None, description="End date filter (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Fetch prioritized theme clusters and customer pain points directly from PostgreSQL.
    Scoped to PM workspace (project_id) if provided.
    """
    try:
        if not end_date:
            end_date = datetime.utcnow()
        elif end_date.tzinfo is not None:
            end_date = end_date.replace(tzinfo=None)

        if not start_date:
            start_date = end_date - timedelta(days=365)
        elif start_date.tzinfo is not None:
            start_date = start_date.replace(tzinfo=None)

        repo = AnalyticsRepository(db)
        clusters = await get_theme_clusters_from_db(
            repo=repo,
            start_date=start_date,
            end_date=end_date,
            project_id=project_id,
        )

        return {
            "success": True,
            "message": "Successfully fetched analytics clusters.",
            "data": clusters,
        }

    except Exception as e:
        logger.error("Error fetching analytics clusters", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "DATABASE_ERROR", "message": str(e)},
        )


@router.get("/trends", status_code=status.HTTP_200_OK)
async def get_feedback_trends(
    project_id: Optional[str] = Query(default=None, description="Filter by PM workspace project ID"),
    time_window_days: int = Query(default=30, description="Time window in days for trend aggregation"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Retrieve customer feedback trends over a given time window.
    Uses pandas aggregation pipeline and single PM scope if project_id is provided.
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
            time_window_days=time_window_days,
        )

        return {
            "success": True,
            "message": f"Successfully fetched feedback trends for the last {time_window_days} days.",
            "data": {
                "time_window_days": time_window_days,
                "trends": trends,
            },
        }
    except Exception as e:
        logger.error("Error fetching feedback trends", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "TRENDS_FETCH_ERROR", "message": str(e)},
        )


@router.get("/executive-summary", status_code=status.HTTP_200_OK)
async def get_executive_summary(
    project_id: Optional[str] = Query(default=None, description="Filter by PM workspace project ID"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Generates an executive summary payload for product strategy reporting and AI context.
    """
    try:
        repo = AnalyticsRepository(db)

        # 1. Fetch system KPIs
        kpis = await repo.fetch_kpi_summary_metrics()

        # 2. Fetch top pain points
        clusters = await get_theme_clusters_from_db(repo=repo, project_id=project_id)
        top_pain_points = clusters[:3] if clusters else []

        # 3. Fetch feature request demand
        feature_demand = await get_feature_request_analytics(repo=repo, project_id=project_id)

        return {
            "success": True,
            "message": "Successfully generated executive summary analytics.",
            "data": {
                "kpis": kpis,
                "top_pain_points": top_pain_points,
                "feature_request_demand": feature_demand,
            },
        }
    except Exception as e:
        logger.error("Error generating executive summary", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "EXECUTIVE_SUMMARY_ERROR", "message": str(e)},
        )