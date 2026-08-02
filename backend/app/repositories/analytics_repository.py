from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.models.feedback import Feedback  # Importing Akhila's SQLAlchemy Model


class AnalyticsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def fetch_feedback_for_clustering(
        self, start_date: datetime, end_date: datetime
    ) -> List[Dict[str, Any]]:
        """
        Retrieves live feedback data from Akhila's seeded PostgreSQL database.
        """
        sql = text("""
            SELECT 
                id::text AS id,
                content,
                source AS category,
                CASE 
                    WHEN sentiment = 'positive' THEN 0.8
                    WHEN sentiment = 'neutral' THEN 0.0
                    WHEN sentiment = 'negative' THEN -0.8
                    ELSE 0.0
                END AS sentiment_score,
                2.0 AS severity_weight,
                created_at
            FROM feedback
            WHERE created_at >= :start_date 
              AND created_at <= :end_date
              AND content IS NOT NULL
        """)
        
        result = await self.db.execute(sql, {"start_date": start_date, "end_date": end_date})
        return [dict(row) for row in result.mappings().all()]

    async def fetch_kpi_summary_metrics(self) -> Dict[str, Any]:
        """
        Computes system-wide KPIs across seeded feedback, tickets, and features.
        """
        sql = text("""
            SELECT 
                (SELECT COUNT(*) FROM feedback) AS total_feedback,
                (SELECT COUNT(*) FROM tickets WHERE status = 'open') AS open_tickets,
                (SELECT COUNT(*) FROM features WHERE status = 'completed') AS completed_features,
                (SELECT COUNT(*) FROM projects) AS total_projects
        """)
        result = await self.db.execute(sql)
        row = result.mappings().first()
        return dict(row) if row else {}