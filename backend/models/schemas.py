from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

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
    model_confidence: Dict[str, Any]
    fallback_status: str
    severity_score: float = Field(..., description="Historical mean severity score for the corridor")
    predicted_bucket: str = Field(..., description="Report-Time Predictive Score bucket")
    predicted_score: float = Field(..., description="Report-Time Predictive raw score")
    predictive_factors: Dict[str, Any] = Field(default_factory=dict, description="Rule-based breakdown factors")
    ml_importances: Dict[str, float] = Field(default_factory=dict, description="Global LightGBM feature importances")

class PredictAtReportRequest(BaseModel):
    priority: str
    corridor: str

class PredictAtReportResponse(BaseModel):
    predicted_bucket: str
    predicted_score: float
    contributing_factors: dict

class CalibrationLedgerEntry(BaseModel):
    id: str
    incident_seq_num: int
    timestamp: str
    closed_datetime: Optional[str] = None
    predicted_bucket: str
    severity_bucket: str
    raw_abs_error: float
    raw_bias: float
    rolling_error: float
    rolling_bias: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    cause: Optional[str] = None
    corridor: str

class CalibrationSystemTrend(BaseModel):
    initial_mean_abs_error: float
    final_mean_abs_error: float
    error_pct_change: float
    initial_mean_bias: float
    final_mean_bias: float
    status: str

class CalibrationSummary(BaseModel):
    total_corridors: int
    insufficient_history_corridors: int
    trend_eligible_corridors: int
    system_wide_trend: CalibrationSystemTrend


class MapEvent(BaseModel):
    latitude: float
    longitude: float
    severity_score: float
    cause: str
    corridor: str
    severity_bucket: str
