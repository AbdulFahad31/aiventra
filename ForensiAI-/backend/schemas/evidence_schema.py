from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class EvidenceUpload(BaseModel):
    """Schema for evidence upload"""
    file_type: str  # autopsy, cctv, gps, metadata, image


class EvidenceResponse(BaseModel):
    """Schema for evidence response"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: str
    file_type: str
    file_name: str
    processed: bool
    uploaded_at: datetime
