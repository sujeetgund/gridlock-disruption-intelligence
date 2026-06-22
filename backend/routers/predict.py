from fastapi import APIRouter
import pandas as pd
from typing import Dict, Any

from ..models.schemas import PredictRequest, PredictResponse

router = APIRouter()

def get_bucket_from_duration(duration_hours: float) -> str:
    """Uses exact edges calculated from Step 1 quantiles."""
    if duration_hours < 1.1:
        return "Low"
    elif duration_hours < 5.5:
        return "Medium"
    elif duration_hours < 639.9:
        return "High"
    else:
        return "Critical"

@router.post("/predict", response_model=PredictResponse)
def predict_severity(req: PredictRequest):
    from ..main import app_data
    
    # 1. Rule Engine - Clearance Time (Median Duration Lookup)
    cause = req.event_cause
    corr = req.corridor
    
    med_combo = app_data.get('median_duration_combo', {})
    count_combo = app_data.get('count_combo', {})
    med_cause = app_data.get('median_duration_cause', {})
    count_cause = app_data.get('count_cause', {})
    
    # Lookup tuple key
    combo_key = (cause, corr)
    
    fallback_status = ""
    if combo_key in med_combo:
        predicted_duration = med_combo[combo_key]
        n_events = count_combo.get(combo_key, 0)
        fallback_status = f"Based on {n_events} historical {cause} events on {corr}"
    else:
        # Fallback to overall cause median, or 1.0 hr if completely unknown
        predicted_duration = med_cause.get(cause, 1.0)
        n_events = count_cause.get(cause, 0)
        if n_events > 0:
            fallback_status = f"Based on generic {cause} median ({n_events} total events) due to insufficient corridor history"
        else:
            fallback_status = "Default fallback (no historical data)"
        
    # 2. Rule Engine - Structural UI Precedence Bucket
    display_bucket = get_bucket_from_duration(predicted_duration)
    
    # 3. Rule Engine - Resource Count
    # Find corridor's historical high priority count
    corridors = app_data.get('corridors', [])
    corr_stats = next((c for c in corridors if c['corridor'] == corr), None)
    
    high_pri_count = corr_stats['high_priority_count'] if corr_stats else 0
    max_high_pri = app_data.get('max_high_priority_events', 1) # avoid division by zero
    
    # Formula: Base(2) + Risk Premium(up to 4) + Active Premium(2 if High)
    risk_premium = int((high_pri_count / max(max_high_pri, 1)) * 4)
    active_premium = 2 if req.priority == 'High' else 0
    recommended_officers = 2 + risk_premium + active_premium
    
    # 4. Rule Engine - Diversion Required
    diversion_required = req.requires_road_closure or (req.priority == 'High')
    
    # 5. ML Model Prediction (Secondary Directional Read)
    model = app_data.get('model')
    ml_bucket = "Unknown"
    if model is not None:
        # Prepare DataFrame for model input
        input_data = pd.DataFrame([{
            'event_cause': cause,
            'corridor': corr,
            'priority': req.priority,
            'requires_road_closure': req.requires_road_closure,
            'hour_of_day': req.hour_of_day,
            'day_of_week': req.day_of_week,
            'is_weekend': 1 if req.day_of_week >= 5 else 0
        }])
        
        # Cast categorical types exactly as trained
        for col in ['event_cause', 'corridor', 'priority', 'requires_road_closure']:
            input_data[col] = input_data[col].astype('category')
            
        try:
            pred = model.predict(input_data)
            ml_bucket = str(pred[0])
        except Exception as e:
            ml_bucket = "Error"

    # 6. Report-Time Predictive Score (Phase 1 Logic) for Explainability Panel
    from ..scoring.predictive import calculate_predictive_score
    predicted_bucket, predicted_score, predictive_factors = calculate_predictive_score(req.priority, req.corridor, app_data)

    # 7. Global Feature Importances for ML Directional Read Explainability
    ml_importances = {}
    if model is not None and hasattr(model, 'feature_importances_') and hasattr(model, 'feature_name_'):
        importances = model.feature_importances_
        feature_names = model.feature_name_
        total_importance = sum(importances)
        if total_importance > 0:
            for name, imp in zip(feature_names, importances):
                ml_importances[name] = float(imp / total_importance)

    # Return structured payload
    return PredictResponse(
        display_severity_bucket=display_bucket,
        ml_severity_bucket=ml_bucket,
        predicted_duration_hours=round(predicted_duration, 2),
        recommended_officers=recommended_officers,
        diversion_required=diversion_required,
        model_confidence=app_data.get('model_confidence', {}),
        fallback_status=fallback_status,
        severity_score=corr_stats['mean_severity'] if corr_stats else 0.0,
        predicted_bucket=predicted_bucket,
        predicted_score=predicted_score,
        predictive_factors=predictive_factors,
        ml_importances=ml_importances
    )

from ..models.schemas import PredictAtReportRequest, PredictAtReportResponse
from ..scoring.predictive import calculate_predictive_score

@router.post("/predict-at-report", response_model=PredictAtReportResponse)
def predict_at_report(req: PredictAtReportRequest):
    from ..main import app_data
    bucket, score, factors = calculate_predictive_score(req.priority, req.corridor, app_data)
    
    return PredictAtReportResponse(
        predicted_bucket=bucket,
        predicted_score=score,
        contributing_factors=factors
    )

