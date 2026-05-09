from typing import Any, Dict, List

from services.firestore_service import FirestoreRepository
from utils.logger import log_info


class ReportGenerator:
    """Generate final investigation report from Firestore collections."""

    @staticmethod
    def generate_report(case_id: str, repo: FirestoreRepository | None = None) -> Dict[str, Any]:
        repo = repo or FirestoreRepository()
        case = repo.get_case(case_id)
        if not case:
            return {"error": "Case not found"}

        timeline_events = repo.list_timeline_events(case_id)
        ai_results = repo.list_analysis_results(case_id)
        risk_flags = repo.list_risk_reports(case_id)
        evidence_files = repo.list_evidence(case_id)

        autopsy_data = _result_for(ai_results, "autopsy_agent")
        correlation_data = _result_for(ai_results, "correlation_agent")
        summary_data = _result_for(ai_results, "summary_agent")

        timeline = [
            {
                "timestamp": event.get("timestamp", ""),
                "source": event.get("source", ""),
                "event": event.get("event", ""),
                "severity": event.get("severity", "low"),
                "metadata": event.get("metadata_json") or event.get("metadata") or {},
            }
            for event in timeline_events
        ]

        flags = [
            {
                "name": flag.get("flag_name", ""),
                "description": flag.get("description", ""),
                "score": flag.get("score", 0.0),
            }
            for flag in risk_flags
        ]

        recommendations = summary_data.get("recommendations", [])
        injuries = autopsy_data.get("injuries", [])
        toxicology = autopsy_data.get("toxins", []) or autopsy_data.get("toxicology", [])
        anomalies = correlation_data.get("anomalies", [])
        suspicious_patterns = correlation_data.get("suspicious_patterns", [])
        generated_at = str(case.get("updated_at") or case.get("created_at"))
        intelligence = _build_investigative_intelligence(
            case=case,
            autopsy_data=autopsy_data,
            timeline=timeline,
            flags=flags,
            anomalies=anomalies,
            suspicious_patterns=suspicious_patterns,
            limitations=_build_limitations(evidence_files, timeline, anomalies),
        )

        structured_report = {
            "metadata": {
                "report_title": "ForensiAI Forensic Investigation Report",
                "report_version": "1.0",
                "generated_at": generated_at,
                "generated_by": "ForensiAI Backend",
                "case_status": case.get("status"),
            },
            "case_details": {
                "case_id": case.get("case_id"),
                "victim_name": case.get("victim_name"),
                "incident_location": case.get("incident_location"),
                "incident_date": case.get("incident_date"),
                "case_notes": case.get("notes"),
            },
            "evidence_summary": {
                "total_files": len(evidence_files),
                "processed_files": len([item for item in evidence_files if item.get("processed")]),
                "files": [
                    {
                        "file_name": item.get("file_name"),
                        "file_type": item.get("file_type"),
                        "processed": item.get("processed", False),
                        "uploaded_at": str(item.get("uploaded_at")),
                        "storage_url": item.get("storage_url"),
                    }
                    for item in evidence_files
                ],
            },
            "autopsy_findings": {
                "cause_of_death": autopsy_data.get("cause_of_death", "Under investigation"),
                "manner_of_death": autopsy_data.get("manner_of_death", "Not determined"),
                "injuries": injuries,
                "toxicology": toxicology,
                "confidence": autopsy_data.get("confidence", 0.0),
            },
            "timeline_analysis": {"total_events": len(timeline), "events": timeline},
            "correlation_analysis": {
                "anomalies": anomalies,
                "suspicious_patterns": suspicious_patterns,
                "confidence": correlation_data.get("confidence", 0.0),
            },
            "risk_assessment": {
                "risk_level": case.get("risk_level"),
                "risk_score": case.get("risk_score"),
                "flags": flags,
            },
            "investigation_summary": {
                "summary": summary_data.get("summary", "Investigation in progress"),
                "recommendations": recommendations,
                "confidence": summary_data.get("confidence", 0.0),
            },
            "investigative_intelligence": intelligence,
            "limitations": intelligence["limitations"],
        }

        report = {
            "case_id": case.get("case_id"),
            "victim_name": case.get("victim_name"),
            "incident_location": case.get("incident_location"),
            "incident_date": case.get("incident_date"),
            "status": case.get("status"),
            "summary": summary_data.get("summary", "Investigation in progress"),
            "cause_of_death": autopsy_data.get("cause_of_death", "Under investigation"),
            "manner_of_death": autopsy_data.get("manner_of_death", "Not determined"),
            "injuries": injuries,
            "toxicology": toxicology,
            "timeline": timeline,
            "anomalies": anomalies,
            "suspicious_patterns": suspicious_patterns,
            "risk_level": case.get("risk_level"),
            "risk_score": case.get("risk_score"),
            "flags": flags,
            "recommendations": recommendations,
            "investigative_intelligence": intelligence,
            "case_notes": case.get("notes"),
            "generated_at": generated_at,
            "structured_report": structured_report,
        }

        repo.save_report(case_id, report)
        log_info(f"[OK] Report generated for case {case_id}")
        return report


def _result_for(results: List[Dict[str, Any]], agent_name: str) -> Dict[str, Any]:
    result = next((item for item in results if item.get("agent_name") == agent_name), None)
    return result.get("result_json", {}) if result else {}


def _build_limitations(evidence_files: List[Dict[str, Any]], timeline: List[Dict[str, Any]], anomalies: List[str]) -> List[str]:
    limitations = []
    uploaded_types = {item.get("file_type") for item in evidence_files}

    if "cctv" not in uploaded_types:
        limitations.append("No CCTV logs were uploaded for this case.")
    if "gps" not in uploaded_types:
        limitations.append("No GPS logs were uploaded for this case.")
    if "metadata" not in uploaded_types:
        limitations.append("No metadata files were uploaded for this case.")
    if len(timeline) <= 1:
        limitations.append("Timeline reconstruction is limited because only autopsy-derived events are available.")

    limitations.extend(anomalies)
    return list(dict.fromkeys(limitations))


def _build_investigative_intelligence(
    case: Dict[str, Any],
    autopsy_data: Dict[str, Any],
    timeline: List[Dict[str, Any]],
    flags: List[Dict[str, Any]],
    anomalies: List[str],
    suspicious_patterns: List[str],
    limitations: List[str],
) -> Dict[str, Any]:
    injuries = [str(item) for item in autopsy_data.get("injuries", []) if str(item).strip()]
    cause = str(autopsy_data.get("cause_of_death") or "undetermined")
    manner = str(autopsy_data.get("manner_of_death") or "not determined")
    notes = str(case.get("notes") or "")
    evidence_text = " ".join([cause, manner, notes, " ".join(injuries)]).lower()
    flag_names = {str(flag.get("name", "")).lower() for flag in flags}

    force_level = "unknown"
    if any(term in evidence_text for term in ["sixty", "60", "multiple stab", "multiple injuries", "multiple wound"]):
        force_level = "extreme overkill pattern"
    elif any(term in evidence_text for term in ["stab", "sharp", "knife", "incised"]):
        force_level = "sharp-force assault pattern"
    elif any(term in evidence_text for term in ["trauma", "blunt", "fracture"]):
        force_level = "traumatic assault pattern"

    likely_scene = "Primary scene is not confirmed from available evidence."
    if timeline:
        first = timeline[0]
        likely_scene = (
            f"Earliest available event is from {first.get('source', 'unknown source')} at "
            f"{first.get('timestamp', 'unknown time')}: {first.get('event', 'no event text')}."
        )

    crime_story = _compose_crime_story(case, cause, manner, injuries, timeline, force_level, anomalies, limitations)
    breakthrough = _identify_case_breakthrough(force_level, injuries, timeline, flags, evidence_text)

    hypotheses = []
    if "recent_conflict" in flag_names or any(term in evidence_text for term in ["argument", "conflict", "dispute", "stabbed with knife"]):
        hypotheses.append({
            "title": "Known-person or conflict-driven assault",
            "reasoning": "Case notes or risk flags indicate a recent dispute/weapon assault pattern. Prior relationship, threats, calls, and witness accounts should be tested first.",
            "confidence": "medium",
        })
    if force_level == "extreme overkill pattern":
        hypotheses.append({
            "title": "Personal motive or emotionally driven attack",
            "reasoning": "Very high wound count usually deserves a suspect-prioritization review around personal grievance, rage, retaliation, or close-contact escalation.",
            "confidence": "medium",
        })
    if any("gps" in str(event.get("source", "")).lower() or "cctv" in str(event.get("source", "")).lower() for event in timeline):
        hypotheses.append({
            "title": "Movement trail can narrow suspect window",
            "reasoning": "CCTV/GPS entries create a route and timing chain. Police should compare this movement path against last-seen witnesses, vehicle sightings, and phone tower records.",
            "confidence": "medium",
        })
    if not hypotheses:
        hypotheses.append({
            "title": "Evidence-limited homicide/violent death review",
            "reasoning": "Current material supports a violent death review, but suspect direction is limited until scene, witness, CCTV, GPS, call-detail, and weapon evidence are joined.",
            "confidence": "low",
        })

    contradictions = []
    if limitations:
        contradictions.append("Major evidence gaps remain: " + "; ".join(limitations[:3]))
    if len(timeline) <= 1:
        contradictions.append("Timeline is too thin to confirm where the assault began, ended, or whether body discovery location equals offence location.")
    if anomalies:
        contradictions.extend(anomalies[:4])
    if not contradictions:
        contradictions.append("No direct contradiction detected, but this only means uploaded sources did not conflict.")

    return {
        "crime_story": crime_story,
        "case_breakthrough": breakthrough,
        "investigative_hypotheses": hypotheses,
        "timeline_interpretation": _interpret_timeline(timeline),
        "contradictions_and_gaps": contradictions,
        "priority_leads": _build_leads(timeline, injuries, evidence_text, limitations),
        "action_plan": _build_action_plan(force_level, timeline, injuries, flags, limitations, breakthrough),
        "likely_scene_assessment": likely_scene,
        "limitations": limitations,
        "suspicious_patterns": suspicious_patterns,
    }


def _compose_crime_story(case: Dict[str, Any], cause: str, manner: str, injuries: List[str], timeline: List[Dict[str, Any]], force_level: str, anomalies: List[str], limitations: List[str]) -> str:
    injury_text = ", ".join(injuries[:6]) if injuries else "no structured injuries were extracted"
    timeline_text = (
        f"The available timeline contains {len(timeline)} event(s), beginning at {timeline[0].get('timestamp')} "
        f"and ending at {timeline[-1].get('timestamp')}."
        if timeline else
        "No reliable movement timeline was available from the uploaded evidence."
    )
    anomaly_text = " Correlation review highlights: " + "; ".join(anomalies[:3]) + "." if anomalies else ""
    limitation_text = " The reconstruction is limited by: " + "; ".join(limitations[:3]) + "." if limitations else ""
    return (
        f"Based on the uploaded evidence, {case.get('victim_name')} appears to have suffered {cause.lower()} "
        f"with manner recorded as {manner.lower()}. The injury pattern ({injury_text}) points to a "
        f"{force_level}, not a simple unexplained death. {timeline_text}{anomaly_text}{limitation_text} "
        "The strongest investigative reading is that police should treat the medical findings, movement evidence, "
        "and missing evidence gaps as one combined sequence: establish the victim's last confirmed normal contact, "
        "identify who had access during the injury window, and test whether the body/recovery location matches the assault location."
    )


def _identify_case_breakthrough(force_level: str, injuries: List[str], timeline: List[Dict[str, Any]], flags: List[Dict[str, Any]], evidence_text: str) -> str:
    if force_level == "extreme overkill pattern":
        return "The possible breakthrough is motive narrowing: the wound pattern suggests rage, retaliation, or a close-contact assault. Prioritize people with recent conflict, repeated contact, rejected demands, debt/dispute history, or direct access to the victim."
    if any("defensive" in injury.lower() for injury in injuries):
        return "The possible breakthrough is victim resistance: defensive wounds imply the victim saw or confronted the attacker. Look for suspect injuries, torn clothing, blood transfer, and immediate post-offence medical treatment."
    if timeline and any("cctv" in str(event.get("source", "")).lower() for event in timeline):
        return "The possible breakthrough is route reconstruction: CCTV timestamps should be matched with GPS/phone tower records to isolate who shadowed the victim."
    if any("recent_conflict" in str(flag.get("name", "")).lower() for flag in flags) or "stabbed with knife" in evidence_text:
        return "The possible breakthrough is weapon-source tracing: identify who possessed, bought, borrowed, cleaned, or disposed of a knife near the incident window."
    return "The possible breakthrough is evidence completion: obtain CCTV, GPS, phone records, scene photos, and witness last-seen statements before suspect ranking."


def _interpret_timeline(timeline: List[Dict[str, Any]]) -> List[str]:
    if not timeline:
        return ["No timeline can be reconstructed until movement, scene, or device evidence is uploaded."]
    notes = [f"{len(timeline)} event(s) are available. Treat the first and last event as boundary markers, not proof of the full offence window."]
    if len(timeline) >= 2:
        notes.append(f"The current boundary runs from {timeline[0].get('timestamp')} to {timeline[-1].get('timestamp')}. Police should search this span for missing sightings, calls, and suspect movement.")
    sources = sorted({str(event.get("source", "unknown")) for event in timeline})
    notes.append(f"Timeline sources present: {', '.join(sources)}. Any missing source type weakens the reconstruction.")
    return notes


def _build_leads(timeline: List[Dict[str, Any]], injuries: List[str], evidence_text: str, limitations: List[str]) -> List[str]:
    leads = []
    if any("stab" in injury.lower() or "sharp" in injury.lower() for injury in injuries) or "knife" in evidence_text:
        leads.append("Weapon lead: trace kitchen/workplace knives, recent purchases, disposal spots, cleaned blades, and blood-transfer surfaces.")
    if any("defensive" in injury.lower() for injury in injuries):
        leads.append("Suspect injury lead: check hospitals, clinics, pharmacy purchases, bandages, and witnesses who saw hand/arm cuts after the incident.")
    if timeline:
        leads.append("Movement lead: map every CCTV/GPS timestamp and pull nearby cameras for 30 minutes before and after each point.")
    if any("gps" in item.lower() for item in limitations):
        leads.append("Device lead: collect phone CDR/tower dumps and victim/suspect location history because GPS evidence is missing or incomplete.")
    if any("cctv" in item.lower() for item in limitations):
        leads.append("Scene lead: urgently collect private-shop, traffic, apartment, and fuel-station CCTV before overwrite windows expire.")
    if not leads:
        leads.append("Interview lead: rebuild the final 24 hours using family, coworkers, neighbours, transport records, and digital chats.")
    return leads


def _build_action_plan(force_level: str, timeline: List[Dict[str, Any]], injuries: List[str], flags: List[Dict[str, Any]], limitations: List[str], breakthrough: str) -> List[Dict[str, str]]:
    actions = [
        {"priority": "Immediate", "task": "Lock the offence window", "why": "Use the first/last reliable sighting, body discovery time, autopsy indicators, calls, CCTV, and GPS to reduce the suspect pool."},
        {"priority": "Immediate", "task": "Test the main breakthrough", "why": breakthrough},
    ]
    if force_level in {"extreme overkill pattern", "sharp-force assault pattern"}:
        actions.append({"priority": "High", "task": "Run weapon and blood-transfer investigation", "why": "Sharp-force cases often break through weapon recovery, cleaning attempts, clothing stains, disposal routes, and suspect injuries."})
    if timeline:
        actions.append({"priority": "High", "task": "Create a route map", "why": "Convert every CCTV/GPS point into a map and look for repeated vehicles, followers, or unexplained stop points."})
    if any("defensive" in injury.lower() for injury in injuries):
        actions.append({"priority": "High", "task": "Search for attacker injury evidence", "why": "Defensive injuries increase the chance that the attacker was scratched, cut, bruised, or left touch DNA."})
    if limitations:
        actions.append({"priority": "Medium", "task": "Close evidence gaps", "why": "Missing sources can hide contradictions. Collect the unavailable evidence before treating the narrative as complete."})
    return actions
