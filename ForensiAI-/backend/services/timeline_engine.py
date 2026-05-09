from typing import List, Dict, Any
from datetime import datetime
from utils.logger import log_info, log_error


class TimelineEngine:
    """
    Reconstruct investigation timeline from multiple sources
    
    Uses deterministic logic for:
    - Timestamp sorting
    - Chronological reconstruction
    - Event merging
    - Duplicate removal
    """
    
    @staticmethod
    def normalize_timestamp(ts: str) -> datetime:
        """Parse various timestamp formats to datetime"""
        if not ts:
            return datetime.min
        
        ts = str(ts).strip()
        
        # Try common formats
        formats = [
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
            "%d-%m-%Y %H:%M:%S",
            "%d/%m/%Y %H:%M:%S",
            "%Y/%m/%d %H:%M:%S",
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(ts, fmt)
            except ValueError:
                continue
        
        # Fallback: return min if parsing fails
        return datetime.min
    
    @staticmethod
    def remove_duplicates(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate events within 5-minute window"""
        if not events:
            return []
        
        unique_events = []
        seen_signatures = set()
        
        for event in events:
            # Create signature from event
            sig = (
                event.get("timestamp", ""),
                event.get("event", ""),
                event.get("source", "")
            )
            
            # Skip if similar event seen recently
            if sig not in seen_signatures:
                unique_events.append(event)
                seen_signatures.add(sig)
        
        log_info(f"[OK] Removed {len(events) - len(unique_events)} duplicate events")
        return unique_events
    
    @staticmethod
    def sort_events(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Sort events chronologically"""
        return sorted(
            events,
            key=lambda e: TimelineEngine.normalize_timestamp(e.get("timestamp", ""))
        )
    
    @staticmethod
    def merge_events(events: List[Dict[str, Any]], time_window_minutes: int = 5) -> List[Dict[str, Any]]:
        """
        Merge events that occur within time window
        Useful for combining related events from different sources
        """
        if not events:
            return []
        
        merged = []
        current_group = []
        last_time = None
        
        for event in events:
            current_time = TimelineEngine.normalize_timestamp(event.get("timestamp", ""))
            
            if last_time is None:
                current_group = [event]
                last_time = current_time
            else:
                time_diff = (current_time - last_time).total_seconds() / 60
                
                if time_diff <= time_window_minutes:
                    current_group.append(event)
                else:
                    # Flush group
                    if current_group:
                        merged_event = TimelineEngine._merge_group(current_group)
                        merged.append(merged_event)
                    
                    current_group = [event]
                    last_time = current_time
        
        # Flush last group
        if current_group:
            merged_event = TimelineEngine._merge_group(current_group)
            merged.append(merged_event)
        
        return merged
    
    @staticmethod
    def _merge_group(events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Merge a group of events into one"""
        if len(events) == 1:
            return events[0]
        
        sources = list(set(e.get("source", "") for e in events))
        event_texts = [e.get("event", "") for e in events]
        
        merged = {
            "timestamp": events[0].get("timestamp", ""),
            "source": " + ".join(sources),
            "event": " | ".join(filter(None, event_texts)),
            "severity": "medium",
            "metadata": {
                "merged_count": len(events),
                "sources": sources
            }
        }
        
        # Determine severity
        severities = [e.get("severity", "low") for e in events]
        if "high" in severities:
            merged["severity"] = "high"
        elif "medium" in severities:
            merged["severity"] = "medium"
        
        return merged
    
    @staticmethod
    def reconstruct_timeline(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Main timeline reconstruction pipeline
        
        Steps:
        1. Remove duplicates
        2. Sort chronologically
        3. Optional merging
        4. Return final timeline
        """
        # Step 1: Remove duplicates
        unique_events = TimelineEngine.remove_duplicates(events)
        
        # Step 2: Sort chronologically
        sorted_events = TimelineEngine.sort_events(unique_events)
        
        # Step 3: Merge related events
        merged_events = TimelineEngine.merge_events(sorted_events, time_window_minutes=15)
        
        log_info(f"[OK] Timeline reconstructed: {len(merged_events)} events")
        
        return merged_events
