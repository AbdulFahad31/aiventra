from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from config import settings
from firebase_config import get_current_user
from schemas.evidence_schema import EvidenceResponse
from services.firebase_storage import build_storage_path, upload_file_object
from services.firestore_service import FirestoreRepository
from utils.logger import log_error, log_info

router = APIRouter(prefix="/cases", tags=["upload"])


def get_repo() -> FirestoreRepository:
    return FirestoreRepository()


@router.post("/{case_id}/upload", response_model=dict)
async def upload_evidence(
    case_id: str,
    file: UploadFile = File(...),
    file_type: str = Form(...),
    current_user=Depends(get_current_user),
    repo: FirestoreRepository = Depends(get_repo),
):
    """Upload evidence to Firebase Storage and store metadata in Firestore."""
    case = repo.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    valid_types = ["autopsy", "cctv", "gps", "metadata", "image"]
    normalized_type = "image" if file_type == "images" else file_type
    if normalized_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Must be one of: {', '.join(valid_types)}")

    case_upload_dir = Path(settings.upload_dir) / case_id
    case_upload_dir.mkdir(parents=True, exist_ok=True)
    local_path = case_upload_dir / Path(file.filename or "evidence-file").name

    try:
        contents = await file.read()
        local_path.write_bytes(contents)
        await file.seek(0)
        storage_path = build_storage_path(case_id, normalized_type, file.filename or local_path.name)
        storage_details = upload_file_object(
            file.file,
            storage_path=storage_path,
            content_type=file.content_type,
            metadata={"case_id": case_id, "file_type": normalized_type},
        )
    except Exception as exc:
        log_error(f"File upload failed for {file.filename}", exc)
        raise HTTPException(status_code=500, detail="File upload failed") from exc

    evidence = repo.add_evidence({
        "case_id": case_id,
        "file_type": normalized_type,
        "file_name": file.filename,
        "file_path": str(local_path),
        "content_type": file.content_type,
        "processed": False,
        **storage_details,
    })

    log_info(f"[OK] Evidence uploaded to Firebase Storage: {file.filename} ({normalized_type}) for case {case_id}")
    return {
        "message": "File uploaded successfully",
        "file_name": evidence["file_name"],
        "file_type": evidence["file_type"],
        "case_id": case_id,
        "file_path": evidence["file_path"],
        "storage_url": evidence.get("storage_url"),
        "download_url": evidence.get("download_url"),
    }


@router.get("/{case_id}/evidence", response_model=list[EvidenceResponse])
async def list_evidence(
    case_id: str,
    current_user=Depends(get_current_user),
    repo: FirestoreRepository = Depends(get_repo),
):
    """List all evidence metadata for a case from Firestore."""
    if not repo.get_case(case_id):
        raise HTTPException(status_code=404, detail="Case not found")
    return repo.list_evidence(case_id)
