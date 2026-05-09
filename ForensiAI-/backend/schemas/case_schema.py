from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class CaseCreate(BaseModel):
    """Schema for creating a case"""
    victim_name: str
    incident_location: str
    incident_date: str
    notes: Optional[str] = None


class CaseResponse(BaseModel):
    """Schema for case response"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: str
    victim_name: str
    incident_location: str
    incident_date: str
    notes: Optional[str]
    status: str
    risk_level: str
    risk_score: float
    created_at: datetime


class CaseDetailResponse(CaseResponse):
    """Extended case details"""
    pass
