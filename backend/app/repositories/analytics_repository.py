from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.core_models import Feedback  # Importing Akhila's SQLAlchemy Model


class AnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    async def fetch_feedback_for_clustering(
        self, start_date: datetime, end_date: datetime
    ) -> List[Dict[str, Any]]:
        """
        Retrieves live feedback data from PostgreSQL using synchronous DB session.
        """
        sql = text("""
            SELECT 
                id::text AS id,
                feedback_text AS content,
                channel AS category,
                CASE 
                    WHEN LOWER(sentiment) = 'positive' THEN 0.8
                    WHEN LOWER(sentiment) = 'neutral' THEN 0.0
                    WHEN LOWER(sentiment) = 'negative' THEN -0.8
                    ELSE 0.0
                END AS sentiment_score,
                2.0 AS severity_weight,
                created_at
            FROM feedback
            WHERE created_at >= :start_date 
              AND created_at <= :end_date
              AND feedback_text IS NOT NULL
        """)
        
        # Executing via synchronous session directly
        result = self.db.execute(sql, {"start_date": start_date, "end_date": end_date})
        return [dict(row) for row in result.mappings().all()]

    async def fetch_kpi_summary_metrics(self) -> Dict[str, Any]:
        """
        Computes system-wide KPIs across seeded feedback, tickets, and features.
        """
        sql = text("""
            SELECT 
                (SELECT COUNT(*) FROM feedback) AS total_feedback,
                (SELECT COUNT(*) FROM tickets WHERE LOWER(status) = 'open') AS open_tickets,
                (SELECT COUNT(*) FROM features WHERE LOWER(status) = 'completed') AS completed_features,
                (SELECT COUNT(*) FROM projects) AS total_projects
        """)
        
        result = self.db.execute(sql)
        row = result.mappings().first()
        return dict(row) if row else {}