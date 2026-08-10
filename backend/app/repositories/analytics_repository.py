from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.models.core_models import Feedback

class AnalyticsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def fetch_feedback_for_clustering(
        self, start_date: datetime, end_date: datetime, project_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves live feedback strictly adhering to the established database schema.
        """
        # Targeting actual columns: feedback_text, feedback_type, sentiment, priority
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
        params = {"start_date": start_date, "end_date": end_date}
        
        # Scoping by project_id
        if project_id:
            query_str += " AND f.project_id = :project_id"
            params["project_id"] = project_id
            
        sql = text(query_str)
        result = await self.db.execute(sql, params)
        return [dict(row) for row in result.mappings().all()]

    async def fetch_feature_requests(
        self, project_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetches customer feedback specifically categorized as 'Feature Request'[cite: 2].
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
        params = {}
        if project_id:
            query_str += " AND f.project_id = :project_id"
            params["project_id"] = project_id

        sql = text(query_str)
        result = await self.db.execute(sql, params)
        return [dict(row) for row in result.mappings().all()]

    async def fetch_kpi_summary_metrics(self) -> Dict[str, Any]:
        """
        Computes system-wide KPIs across seeded feedback, tickets, and features.
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
        return dict(row) if row else {}