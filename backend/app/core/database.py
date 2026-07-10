# backend/app/core/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Shifting to 5433 routes completely clear of the native Windows background service lock.
# Explicitly using 127.0.0.1 forces Windows to bypass native IPv6 resolution (::1) 
# and stream transactions directly to the containerized IPv4 Docker port mappings.
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://aipm_admin:aipm_secure_password123@127.0.0.1:5433/aipm_metadata"
)

engine = create_engine(
    DATABASE_URL,
    # Production-grade pool sizing allocations to mitigate connection exhaustion spikes
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    FastAPI Dependency Injection Provider.
    Yields an isolated transactional database session context per incoming request 
    and guarantees a secure connection teardown inside the final block lifecycle.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()