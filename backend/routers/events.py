from fastapi import APIRouter
from typing import List, Any

from ..models.schemas import MapEvent

router = APIRouter()

@router.get("/events/map", response_model=List[MapEvent])
def get_map_events():
    # Import app_data from main module to access loaded artifacts
    from ..main import app_data
    return app_data.get('map_events', [])

@router.get("/corridors/leaderboard")
def get_leaderboard():
    from ..main import app_data
    # Return pre-sorted by severity if possible, or just sort here
    corridors = app_data.get('corridors', [])
    sorted_corridors = sorted(corridors, key=lambda x: x.get('mean_severity', 0), reverse=True)
    return sorted_corridors

@router.get("/meta/limitations")
def get_limitations():
    from ..main import app_data
    model_conf = app_data.get('model_confidence', {})
    return {
        "planned_events_gap": "Planned events (festivals/rallies/VIP movement) comprise only ~2.3% of this dataset. Predictions for these event types have very low confidence due to data sparsity. Integration with a BBMP permit feed is recommended for production.",
        "ml_model_status": {
            "reliable": model_conf.get('reliable', False),
            "macro_f1": model_conf.get('macro_f1', 0.0),
            "critical_recall": model_conf.get('critical_recall', 0.0),
            "reason": model_conf.get('reason', "No data loaded")
        },
        "ui_precedence_rule": "The frontend must use 'display_severity_bucket' (derived from the historical rule engine) as the primary visual indicator. 'ml_severity_bucket' is provided strictly as a secondary directional badge."
    }
