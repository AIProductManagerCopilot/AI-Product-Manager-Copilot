# File: backend/app/auth/firebase.py
import logging
import firebase_admin
from firebase_admin import auth
from fastapi import HTTPException, status

logger = logging.getLogger("backend.auth")


def initialize_firebase() -> None:
    """Initializes the Firebase Admin SDK singleton context safely if not already initialized."""
    try:
        firebase_admin.get_app()
    except ValueError:
        # Relies on system credentials / default env initialization
        firebase_admin.initialize_app()
        logger.info("Firebase Admin SDK context initialized successfully.")


def verify_firebase_token(token: str) -> dict:
    """Verifies incoming Firebase ID tokens against the Firebase Auth service.
    
    Never prints or logs raw token contents.
    """
    try:
        initialize_firebase()
        # Official server-side verification process via firebase-admin
        decoded_claims = auth.verify_id_token(token)
        return decoded_claims
    except auth.ExpiredIdTokenError:
        logger.warning("Authentication failure: Expired Firebase ID token encountered.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as exc:
        # Sanitize exception output: track error type mechanics without printing raw inputs
        logger.error(f"Authentication error during token verification: {type(exc).__name__}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )