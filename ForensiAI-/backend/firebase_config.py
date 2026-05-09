from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

import firebase_admin
from fastapi import Depends, HTTPException, Request, status
from firebase_admin import auth, credentials, firestore, storage

from config import settings


def _firebase_options() -> Dict[str, Any]:
    options: Dict[str, Any] = {}
    if settings.firebase_storage_bucket:
        options["storageBucket"] = settings.firebase_storage_bucket
    return options


@lru_cache(maxsize=1)
def get_firebase_app() -> firebase_admin.App:
    """Initialize Firebase Admin SDK once using the existing project."""
    if firebase_admin._apps:
        return firebase_admin.get_app()

    if settings.firebase_credentials_path:
        credentials_path = Path(settings.firebase_credentials_path).expanduser()
        if not credentials_path.exists():
            raise RuntimeError(f"Firebase credentials file not found: {credentials_path}")
        cred = credentials.Certificate(str(credentials_path))
        return firebase_admin.initialize_app(cred, _firebase_options())

    # Supports GOOGLE_APPLICATION_CREDENTIALS or hosted Firebase/GCP runtimes.
    return firebase_admin.initialize_app(options=_firebase_options())


def get_firestore_client():
    get_firebase_app()
    return firestore.client()


def get_storage_bucket():
    get_firebase_app()
    if not settings.firebase_storage_bucket:
        raise RuntimeError("FIREBASE_STORAGE_BUCKET is required for Firebase Storage uploads.")
    return storage.bucket()


async def get_current_user(request: Request) -> Optional[Dict[str, Any]]:
    """Verify Firebase ID tokens sent as Authorization: Bearer <token>."""
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        if settings.require_auth:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing Firebase authentication token",
            )
        return None

    token = authorization.removeprefix("Bearer ").strip()
    try:
        decoded = auth.verify_id_token(token)
    except Exception as exc:
        if settings.require_auth:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Firebase authentication token",
            ) from exc
        return None

    return decoded


CurrentUser = Depends(get_current_user)
