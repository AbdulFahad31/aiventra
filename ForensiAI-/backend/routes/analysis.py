from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from agents.autopsy_agent import analyze_autopsy_report
from agents.correlation_agent import analyze_correlations
from agents.summary_agent import generate_investigation_summary
from firebase_config import get_current_user
from schemas.tod_schema import TODInputSchema
from services.csv_parser import parse_and_normalize
from services.firestore_service import FirestoreRepository
from services.pdf_parser import extract_autopsy_data, parse_pdf
from services.risk_engine import RiskEngine
from services.timeline_engine import TimelineEngine
from services.tod_calculator import TODCalculator
from utils.logger import log_error, log_info

router = APIRouter(prefix="/cases", tags=["analysis"])


def get_repo() -> FirestoreRepository:
    return FirestoreRepository()


async def process_case_analysis(case_id: str, tod_input: dict):
    """Background task: execute full forensic analysis pipeline with Firestore persistence."""
    repo = FirestoreRepository()

    try:
        case = repo.get_case(case_id)
        if not case:
            return

        repo.clear_analysis_outputs(case_id)
        repo.update_case(case_id, {"status": "processing"})

        log_info(f"Starting analysis pipeline for {case_id}")
        log_info("[1/8] Parsing evidence files...")

        evidence_files = repo.list_evidence(case_id)
        parsed_evidence = {"autopsy": {}, "autopsy_texts": [], "events": [], "metadata": {}}

        for evidence in evidence_files:
            file_path = Path(evidence.get("file_path", ""))
            if not file_path.exists():
                continue

            try:
                if evidence.get("file_type") == "autopsy":
                    pdf_data = parse_pdf(str(file_path))
                    extracted_autopsy = extract_autopsy_data(pdf_data["text"])
                    parsed_evidence["autopsy_texts"].append(extracted_autopsy.get("raw_text", pdf_data["text"]))
                    parsed_evidence["autopsy"] = _merge_autopsy_data(parsed_evidence["autopsy"], extracted_autopsy)
                    repo.mark_evidence_processed(evidence["doc_id"])

                elif evidence.get("file_type") in ["cctv", "gps", "metadata"]:
                    events = parse_and_normalize(str(file_path), evidence.get("file_type"))
                    parsed_evidence["events"].extend(events)
                    repo.mark_evidence_processed(evidence["doc_id"])

            except Exception as exc:
                log_error(f"Failed to parse {evidence.get('file_name')}", exc)
                continue

        log_info("[2/8] Normalizing data...")
        all_events = parsed_evidence["events"]

        log_info("[3/8] Calculating time of death...")
        tod_result = TODCalculator.estimate_tod(
            body_temperature=tod_input.get("body_temperature"),
            ambient_temperature=tod_input.get("ambient_temperature"),
            rigor_stage=tod_input.get("rigor_stage"),
        )

        if tod_result["estimated_hours_since_death"] > 0:
            all_events.insert(0, {
                "timestamp": datetime.utcnow().isoformat(),
                "source": "tod_calculation",
                "event": f"Estimated death: {tod_result['estimated_death_window']}",
                "severity": "high",
                "metadata": tod_result,
            })

        log_info("[4/8] Reconstructing timeline...")
        timeline = TimelineEngine.reconstruct_timeline(all_events)
        repo.add_timeline_events(case_id, timeline)
        log_info(f"[4/8] [OK] Timeline: {len(timeline)} events")

        log_info("[5/8] Autopsy analysis...")
        autopsy_text = "\n\n".join(parsed_evidence.get("autopsy_texts", [])) or (
            parsed_evidence["autopsy"].get("raw_text") or parsed_evidence["autopsy"].get("notes", "")
        )
        autopsy_result = analyze_autopsy_report(autopsy_text or "Standard autopsy findings")
        autopsy_result["notes"] = autopsy_text[:4000]
        autopsy_result["manner_of_death"] = parsed_evidence["autopsy"].get("manner_of_death", "")
        repo.add_analysis_result(case_id, "autopsy_agent", autopsy_result)

        parsed_evidence["autopsy"] = autopsy_result
        if autopsy_result.get("cause_of_death") or autopsy_result.get("injuries"):
            autopsy_event = {
                "timestamp": datetime.utcnow().isoformat(),
                "source": "autopsy",
                "event": _build_autopsy_timeline_event(autopsy_result),
                "severity": "high",
                "metadata": {
                    "cause_of_death": autopsy_result.get("cause_of_death", ""),
                    "injuries": autopsy_result.get("injuries", []),
                    "confidence": autopsy_result.get("confidence", 0.0),
                },
            }
            timeline.append(autopsy_event)
            repo.add_timeline_events(case_id, [autopsy_event])

        log_info("[6/8] Correlation analysis...")
        evidence_for_correlation = {"events": timeline, "autopsy": parsed_evidence["autopsy"], "witnesses": {}}
        correlation_result = analyze_correlations(evidence_for_correlation)
        repo.add_analysis_result(case_id, "correlation_agent", correlation_result)
        parsed_evidence["anomalies"] = correlation_result.get("anomalies", [])

        log_info("[7/8] Risk assessment...")
        risk_engine = RiskEngine()
        evidence_for_risk = {
            "events": timeline,
            "autopsy": parsed_evidence["autopsy"],
            "anomalies": parsed_evidence.get("anomalies", []),
            "case_notes": case.get("notes") or "",
            "witnesses": {},
        }
        risk_assessment = risk_engine.evaluate_risk(evidence_for_risk)
        for flag in risk_assessment["flags"]:
            repo.add_risk_report(case_id, flag)

        repo.update_case(case_id, {
            "risk_level": risk_assessment["risk_level"],
            "risk_score": risk_assessment["risk_score"],
        })
        log_info(f"[7/8] [OK] Risk: {risk_assessment['risk_level']} ({risk_assessment['risk_score']})")

        log_info("[8/8] Generating summary...")
        summary_data = {
            "cause_of_death": autopsy_result.get("cause_of_death", ""),
            "injuries": autopsy_result.get("injuries", []),
            "events": timeline,
            "anomalies": parsed_evidence.get("anomalies", []),
            "risk_level": risk_assessment["risk_level"],
        }
        summary_result = generate_investigation_summary(summary_data)
        repo.add_analysis_result(case_id, "summary_agent", summary_result)

        repo.update_case(case_id, {"status": "completed"})
        log_info(f"[OK] Analysis pipeline complete for {case_id}")

    except Exception as exc:
        log_error(f"Analysis pipeline failed for {case_id}", exc)
        repo.update_case(case_id, {"status": "failed"})


def _build_autopsy_timeline_event(autopsy_result: dict) -> str:
    cause = autopsy_result.get("cause_of_death") or "Autopsy findings recorded"
    injuries = autopsy_result.get("injuries", [])
    if injuries:
        return f"{cause}; key injuries: {', '.join(injuries[:4])}"
    return cause


def _merge_autopsy_data(existing: dict, new_data: dict) -> dict:
    if not existing:
        return new_data

    merged = existing.copy()
    for key in ["victim_name", "age", "gender", "cause_of_death", "manner_of_death"]:
        if not merged.get(key) and new_data.get(key):
            merged[key] = new_data[key]

    for key in ["injuries", "toxicology"]:
        combined = list(merged.get(key, [])) + list(new_data.get(key, []))
        seen = set()
        merged[key] = [item for item in combined if item and not (item.lower() in seen or seen.add(item.lower()))]

    merged["notes"] = "\n\n".join(filter(None, [merged.get("notes", ""), new_data.get("notes", "")]))[:4000]
    merged["raw_text"] = "\n\n".join(filter(None, [merged.get("raw_text", ""), new_data.get("raw_text", "")]))
    return merged


@router.post("/{case_id}/analyze")
async def analyze_case(
    case_id: str,
    tod_input: TODInputSchema,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    repo: FirestoreRepository = Depends(get_repo),
):
    """Trigger forensic analysis pipeline."""
    if not repo.get_case(case_id):
        raise HTTPException(status_code=404, detail="Case not found")

    if not repo.list_evidence(case_id):
        raise HTTPException(status_code=400, detail="No evidence files uploaded for this case")

    background_tasks.add_task(process_case_analysis, case_id, tod_input.model_dump())
    log_info(f"[OK] Analysis pipeline started for {case_id}")
    return {
        "status": "processing",
        "case_id": case_id,
        "message": "Forensic analysis pipeline started. Poll /results endpoint for completion.",
    }
