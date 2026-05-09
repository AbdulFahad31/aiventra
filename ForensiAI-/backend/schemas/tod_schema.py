from pydantic import BaseModel
from typing import Optional


class TODInputSchema(BaseModel):
    """Schema for Time of Death input from investigator"""
    body_temperature: Optional[float] = None
    ambient_temperature: Optional[float] = None
    rigor_stage: Optional[str] = None  # early, moderate, full


class TODResultSchema(BaseModel):
    """Schema for Time of Death result"""
    estimated_hours_since_death: float
    confidence_score: float
    estimated_death_window: str
    method_used: str
