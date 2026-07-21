import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Force load the .env file explicitly from the directory root
load_dotenv()

# Initialize structured logging on application boot
from app.core.logging import setup_logging
setup_logging(json_format=False, log_level="INFO")

# Registered right after env and logging setup to prevent early initialization drops
from app.api.v1 import feedback  
from app.api.v1 import copilot

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

# Register core application routers
app.include_router(feedback.router, prefix="/api/v1")
app.include_router(copilot.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "status": "Online", 
        "engine": "FastAPI on Docker isolated port 5433 (Gemini Engine Active)"
    }