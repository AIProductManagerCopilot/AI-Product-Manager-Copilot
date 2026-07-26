from app.core.database import SessionLocal


def get_db():
    """
    Returns a SQLAlchemy database session for seed scripts.
    The caller is responsible for closing the session.
    """
    return SessionLocal()