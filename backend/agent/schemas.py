from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class FieldCreate(BaseModel):
    name: str
    crop: str
    soil_type: str
    area_sqm: float
    latitude: float
    longitude: float
    growth_stage: str
    last_watered_at: Optional[datetime] = None

class FieldResponse(BaseModel):
    id: int
    name: str
    crop: str
    soil_type: str
    area_sqm: float
    latitude: float
    longitude: float
    growth_stage: str
    last_watered_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class IrrigationRecommendation(BaseModel):
    next_watering_datetime: str
    duration_minutes: int
    water_mm: float
    confidence: float
    reasoning: str
    risk_flags: List[str]

class ScheduleResponse(BaseModel):
    id: int
    field_id: int
    recommended_datetime: str
    duration_minutes: int
    water_mm: float
    confidence: float
    reasoning: str
    risk_flags: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    role: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
