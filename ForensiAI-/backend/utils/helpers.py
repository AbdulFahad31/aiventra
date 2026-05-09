import uuid
import json
from datetime import datetime
from typing import Any


def generate_case_id() -> str:
    """Generate unique case ID"""
    return f"CASE-{uuid.uuid4().hex[:8].upper()}"


def generate_timestamp() -> str:
    """Generate ISO format timestamp"""
    return datetime.utcnow().isoformat() + "Z"


def parse_json_safe(json_str: str, default: Any = None) -> Any:
    """Safely parse JSON string"""
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return default if default is not None else {}


def clean_ai_response(response: str) -> str:
    """Clean AI response by removing markdown code fences"""
    response = response.strip()
    if response.startswith("```json"):
        response = response[7:]
    elif response.startswith("```"):
        response = response[3:]
    
    if response.endswith("```"):
        response = response[:-3]
    
    return response.strip()


def format_timestamp(ts: str) -> str:
    """Normalize timestamp to ISO format"""
    if isinstance(ts, str):
        # Try to parse and re-format
        try:
            dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
            return dt.isoformat()
        except:
            return ts
    return str(ts)
