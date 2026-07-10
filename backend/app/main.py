# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import feedback  # Import our new router file

app = FastAPI(
    title="AI Product Manager Copilot API",
    description="Core backend analytics and ingestion pipeline engines",
    version="1.0.0"
)

# Enable CORS so your React frontend (port 3000) can securely talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the new ingestion pipeline router
app.include_router(feedback.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "Online", "engine": "FastAPI on Docker isolated port 5433"}