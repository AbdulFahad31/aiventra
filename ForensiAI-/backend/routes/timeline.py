from fastapi import APIRouter, Depends, HTTPException

from firebase_config import get_current_user
from schemas.result_schema import TimelineEventSchema, TimelineResponse
from services.firestore_service import FirestoreRepository
from utils.logger import log_info

router = APIRouter(prefix="/cases", tags=["timeline"])


def get_repo() -> FirestoreRepository:
    return FirestoreRepository()


@router.get("/{case_id}/timeline", response_model=TimelineResponse)
async def get_timeline(
    case_id: str,
    current_user=Depends(get_current_user),
    repo: FirestoreRepository = Depends(get_repo),
):
    """Get reconstructed investigation timeline from Firestore."""
    if not repo.get_case(case_id):
        raise HTTPException(status_code=404, detail="Case not found")

    events = repo.list_timeline_events(case_id)
    timeline_events = [
        TimelineEventSchema(
            timestamp=event.get("timestamp", ""),
            source=event.get("source", ""),
            event=event.get("event", ""),
            severity=event.get("severity", "low"),
            metadata=event.get("metadata_json") or event.get("metadata"),
        )
        for event in events
    ]

    log_info(f"[OK] Timeline fetched for {case_id}: {len(timeline_events)} events")
    return TimelineResponse(case_id=case_id, events=timeline_events, total_events=len(timeline_events))
