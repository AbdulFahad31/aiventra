from pathlib import Path
from typing import BinaryIO, Dict, Optional
from uuid import uuid4

from firebase_config import get_storage_bucket


def build_storage_path(case_id: str, file_type: str, filename: str) -> str:
    safe_name = Path(filename).name.replace("\\", "_").replace("/", "_")
    return f"cases/{case_id}/evidence/{file_type}/{uuid4().hex}-{safe_name}"


def upload_file_object(
    file_obj: BinaryIO,
    *,
    storage_path: str,
    content_type: Optional[str] = None,
    metadata: Optional[Dict[str, str]] = None,
) -> Dict[str, str]:
    """Upload evidence to Firebase Storage and return stable object details."""
    bucket = get_storage_bucket()
    blob = bucket.blob(storage_path)
    if metadata:
        blob.metadata = metadata
    file_obj.seek(0)
    blob.upload_from_file(file_obj, content_type=content_type)

    try:
        download_url = blob.generate_signed_url(version="v4", expiration=3600)
    except Exception:
        download_url = ""

    return {
        "storage_bucket": bucket.name,
        "storage_path": storage_path,
        "storage_url": f"gs://{bucket.name}/{storage_path}",
        "download_url": download_url,
    }
