import json
from pathlib import Path
from typing import Dict, Any
from utils.logger import log_info, log_error


def parse_metadata_file(file_path: str) -> Dict[str, Any]:
    """
    Parse JSON metadata file
    """
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        log_info(f"[OK] Metadata parsed: {file_path}")
        return data
    
    except Exception as e:
        log_error("Metadata parsing failed", e)
        return {}


def extract_metadata_events(metadata: Dict[str, Any]) -> list:
    """
    Extract timeline events from metadata
    """
    events = []
    
    # Handle array of events
    if isinstance(metadata, list):
        events = metadata
    elif 'events' in metadata:
        events = metadata['events']
    elif 'data' in metadata:
        events = metadata['data'] if isinstance(metadata['data'], list) else [metadata['data']]
    else:
        events = [metadata]
    
    # Ensure all events have required fields
    normalized = []
    for event in events:
        if isinstance(event, dict):
            if 'timestamp' in event or 'time' in event:
                normalized.append(event)
            else:
                # Add as metadata without timestamp
                normalized.append({
                    "timestamp": "",
                    "event": str(event)[:200],
                    "source": "metadata",
                    "metadata": event
                })
    
    log_info(f"[OK] Extracted {len(normalized)} metadata events")
    return normalized
