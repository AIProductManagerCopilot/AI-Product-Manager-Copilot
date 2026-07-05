from fastapi import FastAPI
from backend.app.api.v1.endpoints import router as api_router

app = FastAPI(
    title="AI Product Manager Copilot OS Engine",
    description="Enterprise Multi-Agent Async Text Extraction and Deterministic RAG Pipeline Platform.",
    version="1.0.0"
)

app.include_router(api_router, prefix="/api/v1", tags=["Ingestion Sub-System"])

@app.get("/")
async def root():
    return {"status": "online", "system": "AI-PM OS Backend Engine"}