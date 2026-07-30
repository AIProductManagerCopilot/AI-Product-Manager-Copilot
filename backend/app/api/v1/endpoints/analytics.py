from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.analytics.clustering import get_theme_clusters_from_db
from app.analytics.trends import get_theme_trends_from_db

router = APIRouter()

@router.get("/clusters", response_model=List[dict])
def get_clusters(
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Fetch prioritized theme clusters and customer pain points directly from PostgreSQL.
    """
    return get_theme_clusters_from_db(db=db, start_date=start_date, end_date=end_date)


@router.get("/trends", response_model=List[dict])
def get_trends(
    time_window_days: int = Query(30, description="Time window in days for trend calculations"),
    db: Session = Depends(get_db)
):
    """
    Fetch category trajectory vectors and historical trend buckets directly from PostgreSQL.
    """
    return get_theme_trends_from_db(db=db, time_window_days=time_window_days)
