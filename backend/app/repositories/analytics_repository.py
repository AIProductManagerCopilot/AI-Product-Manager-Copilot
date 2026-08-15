"""
PostgreSQL repository implementation for Analytics and Theme Clustering operations.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.core_models import Feedback

logger = structlog.get_logger(__name__)


class AnalyticsRepository:
    """
    Repository handling raw feedback extraction, KPI aggregation,
    and feature request clustering for the Analytics Engine.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def fetch_feedback_for_clustering(
        self,
        start_date: datetime,
        end_date: datetime,
        project_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves live feedback strictly adhering to the established database schema.
        """
        query_str = """
            SELECT 
                f.id::text AS id,
                f.feedback_text,
                f.feedback_type,
                f.sentiment,
                f.priority,
                f.created_at
            FROM feedback f
            WHERE f.created_at >= :start_date 
              AND f.created_at <= :end_date
              AND f.feedback_text IS NOT NULL
        """
        params: Dict[str, Any] = {
            "start_date": start_date,
            "end_date": end_date,
        }

        # Project workspace scoping
        if project_id:
            query_str += " AND f.project_id = :project_id"
            params["project_id"] = project_id

        sql = text(query_str)
        result = await self.db.execute(sql, params)
        rows = result.mappings().all()
        return [dict(row) for row in rows]

    async def fetch_feature_requests(
        self,
        project_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetches customer feedback specifically categorized as 'Feature Request'.
        """
        query_str = """
            SELECT 
                f.id::text AS id,
                f.feedback_text,
                f.sentiment,
                f.priority,
                f.created_at
            FROM feedback f
            WHERE LOWER(f.feedback_type) = 'feature request'
              AND f.feedback_text IS NOT NULL
        """
        params: Dict[str, Any] = {}
        if project_id:
            query_str += " AND f.project_id = :project_id"
            params["project_id"] = project_id

        sql = text(query_str)
        result = await self.db.execute(sql, params)
        rows = result.mappings().all()
        return [dict(row) for row in rows]

    async def fetch_kpi_summary_metrics(self) -> Dict[str, Any]:
        """
        Computes system-wide KPIs across seeded feedback, tickets, features, and projects.
        Required for the Executive Summary endpoint.
        """
        sql = text("""
            SELECT 
                (SELECT COUNT(*) FROM feedback) AS total_feedback,
                (SELECT COUNT(*) FROM tickets WHERE LOWER(status) = 'open') AS open_tickets,
                (SELECT COUNT(*) FROM features WHERE LOWER(status) = 'completed') AS completed_features,
                (SELECT COUNT(*) FROM projects) AS total_projects
        """)

        result = await self.db.execute(sql)
        row = result.mappings().first()
        return (
            dict(row)
            if row
            else {
                "total_feedback": 0,
                "open_tickets": 0,
                "completed_features": 0,
                "total_projects": 0,
            }
        )