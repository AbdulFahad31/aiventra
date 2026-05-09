from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class TimelineEventSchema(BaseModel):
    """Schema for timeline event"""
    timestamp: str
    source: str  # cctv, gps, metadata, autopsy, ai
    event: str
    severity: str  # low, medium, high
    metadata: Optional[Dict[str, Any]] = None


class TimelineResponse(BaseModel):
    """Schema for timeline response"""
    case_id: str
    events: List[TimelineEventSchema]
    total_events: int


class AIResultResponse(BaseModel):
    """Schema for AI result"""
    model_config = ConfigDict(from_attributes=True)

    agent_name: str
    result_json: Dict[str, Any]
    created_at: datetime


class ReportResponse(BaseModel):
    """Schema for final report"""
    case_id: str
    victim_name: str
    incident_location: str
    incident_date: str
    status: str
    summary: Optional[str]
    cause_of_death: Optional[str]
    injuries: List[str]
    timeline: List[TimelineEventSchema]
    risk_level: str
    risk_score: float
    flags: List[str]
    recommendations: List[str]
