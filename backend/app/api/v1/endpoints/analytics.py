from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

# Adjust these imports to match your exact folder structure if needed
from app.api.dependencies import get_db 
from app.analytics.repositories.analytics_repository import AnalyticsRepository
# If your clustering logic is separate, import it here:
# from app.analytics.clustering import generate_clusters

router = APIRouter()

@router.get("/clusters")
async def get_clusters(
    start_date: datetime = Query(default=None, description="Start date filter (YYYY-MM-DD)"),
    end_date: datetime = Query(default=None, description="End date filter (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch prioritized theme clusters and customer pain points directly from PostgreSQL.
    """
    try:
        # 1. Handle default dates if none are provided in Swagger
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=365) # Default to 1 year back

        # 2. Initialize the repository with the PostgreSQL session
        repo = AnalyticsRepository(db)

        # 3. Fetch the data using the CORRECTED table name
        feedback_data = await repo.fetch_feedback_for_clustering(start_date, end_date)

        # 4. Pass the data to your clustering algorithm (if it's in a separate file)
        # clusters = generate_clusters(feedback_data)

        return {
            "success": True,
            "message": "Successfully fetched analytics clusters.",
            "data": feedback_data # Replace this with 'clusters' if you have a separate clustering function
        }

    except Exception as e:
        # Properly catch and log database/server errors
        raise HTTPException(
            status_code=500, 
            detail={"error_code": "DATABASE_ERROR", "message": str(e)}
        )