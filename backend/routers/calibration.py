from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import math

from ..models.schemas import CalibrationLedgerEntry, CalibrationSummary

router = APIRouter()

@router.get("/calibration/summary", response_model=CalibrationSummary)
def get_calibration_summary():
    """Returns the system-wide calibration trend."""
    from ..main import app_data
    
    summary = app_data.get('calibration_summary')
    if not summary:
        raise HTTPException(status_code=503, detail="Calibration summary not loaded.")
        
    return CalibrationSummary(**summary)

@router.get("/calibration/{corridor}")
def get_corridor_calibration(corridor: str) -> Dict[str, Any]:
    """Returns the chronological calibration ledger for a specific corridor."""
    from ..main import app_data
    
    ledger = app_data.get('calibration_ledger')
    if ledger is None:
        raise HTTPException(status_code=503, detail="Calibration ledger not loaded.")
        
    # Get rows for corridor
    c_df = ledger[ledger['corridor'] == corridor]
    
    if c_df.empty:
        raise HTTPException(status_code=404, detail="Corridor not found in calibration ledger.")
        
    num_incidents = len(c_df)
    insufficient_history = num_incidents < 15
    trend_eligible = num_incidents >= 20
    
    # Replace NaN rolling metrics with None for JSON serialization
    c_df = c_df.replace({math.nan: None})
    
    entries = []
    for _, row in c_df.iterrows():
        entries.append(CalibrationLedgerEntry(
            incident_seq_num=int(row['incident_seq_num']),
            timestamp=str(row['start_datetime']),
            predicted_bucket=str(row['predicted_bucket']),
            severity_bucket=str(row['severity_bucket']),
            raw_abs_error=float(row['raw_abs_error']),
            raw_bias=float(row['raw_bias']),
            rolling_error=float(row['rolling_error']) if row['rolling_error'] is not None else 0.0,
            rolling_bias=float(row['rolling_bias']) if row['rolling_bias'] is not None else 0.0
        ))
        
    return {
        "corridor": corridor,
        "total_incidents": num_incidents,
        "insufficient_history": insufficient_history,
        "trend_eligible": trend_eligible,
        "ledger": entries
    }
