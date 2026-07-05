# backend/app/core/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# In a full staging setup, these variables are loaded dynamically from a secure .env file
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://aipm_admin:aipm_secure_password123@localhost:5432/aipm_metadata"
)

engine = create_engine(
    DATABASE_URL,
    # Pool sizing prevents the API from overwhelming the DB during concurrent usage bursts
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    FastAPI Dependency injection provider. 
    Yields a clean transactional database context per request and safely closes it after.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()