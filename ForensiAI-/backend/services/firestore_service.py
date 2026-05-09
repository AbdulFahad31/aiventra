from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional
from uuid import uuid4

from firebase_config import get_firestore_client


USERS = "users"
CASES = "cases"
EVIDENCE = "evidence"
ANALYSIS_RESULTS = "analysis_results"
TIMELINE_EVENTS = "timeline_events"
REPORTS = "reports"
RISK_REPORTS = "risk_reports"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _clean(data: Dict[str, Any]) -> Dict[str, Any]:
    return {key: value for key, value in data.items() if value is not None}


def _doc_to_dict(snapshot) -> Optional[Dict[str, Any]]:
    if not snapshot.exists:
        return None
    data = snapshot.to_dict() or {}
    data.setdefault("doc_id", snapshot.id)
    return data


class FirestoreRepository:
    """Small persistence layer that keeps route code independent of Firestore calls."""

    def __init__(self):
        self.db = get_firestore_client()

    def upsert_user(self, decoded_token: Dict[str, Any]) -> Dict[str, Any]:
        uid = decoded_token["uid"]
        now = utcnow()
        payload = _clean({
            "uid": uid,
            "email": decoded_token.get("email"),
            "display_name": decoded_token.get("name"),
            "photo_url": decoded_token.get("picture"),
            "provider": "firebase",
            "last_login_at": now,
            "updated_at": now,
        })
        ref = self.db.collection(USERS).document(uid)
        existing = ref.get()
        if not existing.exists:
            payload["created_at"] = now
        ref.set(payload, merge=True)
        return _doc_to_dict(ref.get()) or payload

    def create_case(self, case_id: str, data: Dict[str, Any], owner_uid: Optional[str]) -> Dict[str, Any]:
        now = utcnow()
        payload = _clean({
            "id": int(now.timestamp() * 1000),
            "case_id": case_id,
            "victim_name": data.get("victim_name"),
            "incident_location": data.get("incident_location"),
            "incident_date": data.get("incident_date"),
            "notes": data.get("notes"),
            "status": "pending",
            "risk_level": "LOW",
            "risk_score": 0.0,
            "owner_uid": owner_uid,
            "created_at": now,
            "updated_at": now,
        })
        self.db.collection(CASES).document(case_id).set(payload)
        return payload

    def list_cases(self, owner_uid: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.collection(CASES)
        if owner_uid:
            query = query.where("owner_uid", "==", owner_uid)
        docs = query.stream()
        cases = [_doc_to_dict(doc) for doc in docs if doc.exists]
        return sorted(cases, key=lambda item: item.get("created_at") or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        return _doc_to_dict(self.db.collection(CASES).document(case_id).get())

    def update_case(self, case_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        ref = self.db.collection(CASES).document(case_id)
        if not ref.get().exists:
            return None
        ref.set({**_clean(data), "updated_at": utcnow()}, merge=True)
        return _doc_to_dict(ref.get())

    def add_evidence(self, data: Dict[str, Any]) -> Dict[str, Any]:
        now = utcnow()
        doc_id = data.get("doc_id") or uuid4().hex
        payload = _clean({
            "id": int(now.timestamp() * 1000),
            "doc_id": doc_id,
            "case_id": data.get("case_id"),
            "file_type": data.get("file_type"),
            "file_name": data.get("file_name"),
            "file_path": data.get("file_path"),
            "storage_bucket": data.get("storage_bucket"),
            "storage_path": data.get("storage_path"),
            "storage_url": data.get("storage_url"),
            "download_url": data.get("download_url"),
            "content_type": data.get("content_type"),
            "processed": data.get("processed", False),
            "uploaded_at": now,
            "updated_at": now,
        })
        self.db.collection(EVIDENCE).document(doc_id).set(payload)
        return payload

    def list_evidence(self, case_id: str) -> List[Dict[str, Any]]:
        docs = self.db.collection(EVIDENCE).where("case_id", "==", case_id).stream()
        evidence = [_doc_to_dict(doc) for doc in docs if doc.exists]
        return sorted(evidence, key=lambda item: item.get("uploaded_at") or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

    def mark_evidence_processed(self, doc_id: str) -> None:
        self.db.collection(EVIDENCE).document(doc_id).set(
            {"processed": True, "updated_at": utcnow()},
            merge=True,
        )

    def clear_analysis_outputs(self, case_id: str) -> None:
        for collection in (ANALYSIS_RESULTS, TIMELINE_EVENTS, RISK_REPORTS, REPORTS):
            self.delete_by_case(collection, case_id)

    def delete_by_case(self, collection: str, case_id: str) -> None:
        docs = self.db.collection(collection).where("case_id", "==", case_id).stream()
        batch = self.db.batch()
        count = 0
        for doc in docs:
            batch.delete(doc.reference)
            count += 1
            if count % 450 == 0:
                batch.commit()
                batch = self.db.batch()
        if count % 450:
            batch.commit()

    def add_timeline_events(self, case_id: str, events: Iterable[Dict[str, Any]]) -> None:
        batch = self.db.batch()
        for event in events:
            doc_id = uuid4().hex
            ref = self.db.collection(TIMELINE_EVENTS).document(doc_id)
            batch.set(ref, _clean({
                "id": int(utcnow().timestamp() * 1000),
                "doc_id": doc_id,
                "case_id": case_id,
                "timestamp": event.get("timestamp", ""),
                "source": event.get("source", ""),
                "event": event.get("event", ""),
                "severity": event.get("severity", "low"),
                "metadata_json": event.get("metadata", {}),
                "created_at": utcnow(),
            }))
        batch.commit()

    def list_timeline_events(self, case_id: str) -> List[Dict[str, Any]]:
        docs = self.db.collection(TIMELINE_EVENTS).where("case_id", "==", case_id).stream()
        events = [_doc_to_dict(doc) for doc in docs if doc.exists]
        return sorted(events, key=lambda item: item.get("timestamp") or "")

    def add_analysis_result(self, case_id: str, agent_name: str, result_json: Dict[str, Any]) -> Dict[str, Any]:
        now = utcnow()
        doc_id = f"{case_id}_{agent_name}_{uuid4().hex[:8]}"
        payload = {
            "id": int(now.timestamp() * 1000),
            "doc_id": doc_id,
            "case_id": case_id,
            "agent_name": agent_name,
            "result_json": result_json,
            "created_at": now,
        }
        self.db.collection(ANALYSIS_RESULTS).document(doc_id).set(payload)
        return payload

    def list_analysis_results(self, case_id: str) -> List[Dict[str, Any]]:
        docs = self.db.collection(ANALYSIS_RESULTS).where("case_id", "==", case_id).stream()
        return [_doc_to_dict(doc) for doc in docs if doc.exists]

    def add_risk_report(self, case_id: str, flag: Dict[str, Any]) -> Dict[str, Any]:
        now = utcnow()
        doc_id = uuid4().hex
        payload = {
            "id": int(now.timestamp() * 1000),
            "doc_id": doc_id,
            "case_id": case_id,
            "flag_name": flag.get("flag") or flag.get("flag_name") or flag.get("name", ""),
            "description": flag.get("description", ""),
            "score": float(flag.get("score", 0.0)),
            "created_at": now,
        }
        self.db.collection(RISK_REPORTS).document(doc_id).set(payload)
        return payload

    def list_risk_reports(self, case_id: str) -> List[Dict[str, Any]]:
        docs = self.db.collection(RISK_REPORTS).where("case_id", "==", case_id).stream()
        return [_doc_to_dict(doc) for doc in docs if doc.exists]

    def save_report(self, case_id: str, report: Dict[str, Any]) -> None:
        self.db.collection(REPORTS).document(case_id).set({
            "case_id": case_id,
            "report": report,
            "updated_at": utcnow(),
        })
