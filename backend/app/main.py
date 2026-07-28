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
<<<<<<< HEAD
from app.ai.router import router as ai_router
from app.api.v1 import projects
=======
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d

app = FastAPI(
    title="AI Product Manager Copilot API",
    description="Core backend analytics and ingestion pipeline engines",
    version="1.0.0"
)

<<<<<<< HEAD
# Explicit allowed origins for frontend local dev servers
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Enable CORS so your React frontend can securely talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
=======
# Enable CORS so your React frontend (port 3000) can securely talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register core application routers
app.include_router(feedback.router, prefix="/api/v1")
app.include_router(copilot.router, prefix="/api/v1")
<<<<<<< HEAD
app.include_router(ai_router, prefix="/api/v1/ai", tags=["AI Subsystem"])
app.include_router(projects.router, prefix="/api/v1")
=======
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d

@app.get("/")
def read_root():
    return {
        "status": "Online", 
        "engine": "FastAPI on Docker isolated port 5433 (Gemini Engine Active)"
    }