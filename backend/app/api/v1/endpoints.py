import uuid
from fastapi import APIRouter, status, BackgroundTasks
from backend.app.api.v1.schemas import FeedbackUploadRequest

router = APIRouter()

@router.post("/feedback/ingest", status_code=status.HTTP_202_ACCEPTED, response_model=dict)
async def ingest_feedback(payload: FeedbackUploadRequest, background_tasks: BackgroundTasks):
    mock_task_id = str(uuid.uuid4())
    return {
        "status": "Accepted",
        "task_id": mock_task_id,
        "message": "Async system pipeline accepted transmission for background data analysis."
    }