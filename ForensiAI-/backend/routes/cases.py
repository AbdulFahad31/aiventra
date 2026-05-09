from fastapi import APIRouter, Depends, HTTPException

from firebase_config import get_current_user
from schemas.case_schema import CaseCreate, CaseResponse, CaseDetailResponse
from services.firestore_service import FirestoreRepository
from utils.helpers import generate_case_id
from utils.logger import log_info

router = APIRouter(prefix="/cases", tags=["cases"])


def get_repo() -> FirestoreRepository:
    return FirestoreRepository()


@router.post("", response_model=CaseResponse)
async def create_case(
    case_data: CaseCreate,
    current_user=Depends(get_current_user),
    repo: FirestoreRepository = Depends(get_repo),
):
    """Create a new investigation case in Firestore."""
    if current_user:
        repo.upsert_user(current_user)

    case_id = generate_case_id()
    case = repo.create_case(case_id, case_data.model_dump(), current_user.get("uid") if current_user else None)
    log_info(f"[OK] Firestore case created: {case_id}")
    return case


@router.get("", response_model=list[CaseResponse])
async def list_cases(
    current_user=Depends(get_current_user),
    repo: FirestoreRepository = Depends(get_repo),
):
    """List investigation cases from Firestore."""
    if current_user:
        repo.upsert_user(current_user)
    return repo.list_cases(current_user.get("uid") if current_user else None)


@router.get("/{case_id}", response_model=CaseDetailResponse)
async def get_case(
    case_id: str,
    current_user=Depends(get_current_user),
    repo: FirestoreRepository = Depends(get_repo),
):
    """Get case details from Firestore."""
    case = repo.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.put("/{case_id}")
async def update_case_notes(
    case_id: str,
    notes: str,
    current_user=Depends(get_current_user),
    repo: FirestoreRepository = Depends(get_repo),
):
    """Update case notes in Firestore."""
    case = repo.update_case(case_id, {"notes": notes})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    log_info(f"[OK] Case notes updated: {case_id}")
    return {"message": "Case updated", "case": case}
