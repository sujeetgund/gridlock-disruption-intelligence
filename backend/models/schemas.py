from pydantic import BaseModel
from typing import Optional, List

class PredictRequest(BaseModel):
    event_cause: str
    corridor: str
    priority: str
    requires_road_closure: bool
    hour_of_day: int
    day_of_week: int

class PredictResponse(BaseModel):
    display_severity_bucket: str
    ml_severity_bucket: str
    predicted_duration_hours: float
    recommended_officers: int
    diversion_required: bool
    model_confidence: dict
    
    # Exposing the numeric score purely for map sorting or advanced rendering, not primary UI
    severity_score: float 

class MapEvent(BaseModel):
    latitude: float
    longitude: float
    severity_score: float
    cause: str
    corridor: str
    severity_bucket: str
