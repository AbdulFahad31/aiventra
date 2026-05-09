from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, PlainTextResponse
from firebase_admin import auth

from config import settings
from firebase_config import get_current_user
from services.firestore_service import FirestoreRepository
from services.report_document import render_report_html, render_report_markdown
from services.report_generator import ReportGenerator
from utils.logger import log_info

router = APIRouter(prefix="/cases", tags=["results"])


def get_repo() -> FirestoreRepository:
    return FirestoreRepository()


@router.get("/{case_id}/results")
async def get_analysis_results(
    case_id: str,
    current_user=Depends(get_current_user),
    repo: FirestoreRepository = Depends(get_repo),
):
    """Get analysis status for a case from Firestore."""
    case = repo.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    status_value = case.get("status")
    if status_value == "processing":
        return {"status": "processing", "case_id": case_id, "message": "Analysis pipeline is still running. Please check back soon."}
    if status_value == "failed":
        return {"status": "failed", "case_id": case_id, "message": "Analysis pipeline encountered an error."}
    if status_value == "completed":
        ai_results = repo.list_analysis_results(case_id)
        if not ai_results:
            return {"status": "processing", "case_id": case_id, "message": "Analysis pipeline is still processing results..."}
        return {"status": "complete", "case_id": case_id, "results_ready": True}

    return {"status": status_value, "case_id": case_id}


@router.get("/{case_id}/report", response_model=dict)
async def get_case_report(
    case_id: str,
    current_user=Depends(get_current_user),
    repo: FirestoreRepository = Depends(get_repo),
):
    """Generate and return final investigation report from Firestore data."""
    report = _get_completed_report(case_id, repo)
    return report


@router.get("/{case_id}/report/document", response_class=HTMLResponse)
async def get_case_report_document(
    case_id: str,
    token: str | None = Query(default=None),
    repo: FirestoreRepository = Depends(get_repo),
):
    """Generate a printable documented HTML investigation report."""
    _verify_query_token(token)
    report = _get_completed_report(case_id, repo)
    return HTMLResponse(render_report_html(report))


@router.get("/{case_id}/report/markdown", response_class=PlainTextResponse)
async def get_case_report_markdown(
    case_id: str,
    token: str | None = Query(default=None),
    repo: FirestoreRepository = Depends(get_repo),
):
    """Generate a documented Markdown investigation report."""
    _verify_query_token(token)
    report = _get_completed_report(case_id, repo)
    return PlainTextResponse(
        render_report_markdown(report),
        headers={"Content-Disposition": f'attachment; filename="{case_id}-forensiai-report.md"'},
    )


def _verify_query_token(token: str | None) -> None:
    if not settings.require_auth:
        return
    if not token:
        raise HTTPException(status_code=401, detail="Missing Firebase authentication token")
    try:
        auth.verify_id_token(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid Firebase authentication token") from exc


def _get_completed_report(case_id: str, repo: FirestoreRepository):
    case = repo.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if case.get("status") != "completed":
        raise HTTPException(status_code=400, detail=f"Case analysis not completed. Current status: {case.get('status')}")

    report = ReportGenerator.generate_report(case_id, repo)
    log_info(f"[OK] Documented report generated for {case_id}")
    return report
