import pandas as pd
import json
from pathlib import Path
from typing import List, Dict, Any
from utils.logger import log_info, log_error


def parse_csv(file_path: str) -> List[Dict[str, Any]]:
    """
    Parse CSV file and normalize to timeline events
    """
    try:
        df = pd.read_csv(file_path)
        records = df.to_dict('records')
        
        log_info(f"[OK] CSV parsed: {file_path} ({len(records)} records)")
        return records
    
    except Exception as e:
        log_error("CSV parsing failed", e)
        return []


def normalize_metadata(records: List[Dict[str, Any]], source_type: str) -> List[Dict[str, Any]]:
    """
    Normalize various metadata formats (CCTV, GPS, mobile) into timeline events
    
    source_type: 'cctv', 'gps', 'mobile', 'metadata'
    """
    normalized_events = []
    
    for record in records:
        # Extract timestamp - try common field names
        timestamp = None
        for ts_field in ['timestamp', 'time', 'datetime', 'date_time', 'created_at', 'event_time']:
            if ts_field in record:
                timestamp = record[ts_field]
                break
        
        if not timestamp:
            continue
        
        # Build event
        event = {
            "timestamp": str(timestamp),
            "source": source_type,
            "event": "",
            "severity": "low",
            "metadata": dict(record)
        }
        
        # Generate event description based on source
        if source_type == 'cctv':
            location = record.get('location', record.get('camera', 'Unknown'))
            status = record.get('status', 'detected')
            event["event"] = f"CCTV: {status} at {location}"
            
        elif source_type == 'gps':
            lat = record.get('latitude', record.get('lat', 'N/A'))
            lon = record.get('longitude', record.get('lon', 'N/A'))
            event["event"] = f"GPS: Location {lat}, {lon}"
            
        elif source_type == 'mobile':
            activity = record.get('activity', record.get('type', 'activity'))
            event["event"] = f"Mobile: {activity}"
        
        else:
            event["event"] = str(record).replace('{', '').replace('}', '')[:100]
        
        normalized_events.append(event)
    
    log_info(f"[OK] Normalized {len(normalized_events)} {source_type} events")
    return normalized_events


def parse_and_normalize(file_path: str, file_type: str) -> List[Dict[str, Any]]:
    """
    Parse file and normalize to timeline events
    """
    if file_type not in ['cctv', 'gps', 'metadata', 'mobile']:
        return []
    
    records = parse_csv(file_path)
    return normalize_metadata(records, file_type)
