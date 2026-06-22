import math
from typing import Dict, Any, Tuple

def calculate_predictive_score(priority: str, corridor: str, app_data: Dict[str, Any]) -> Tuple[str, float, Dict[str, Any]]:
    """
    Calculate the Report-Time Predictive Severity Score.
    This function strictly forbids using post-resolution fields like completion time or the amount of time the event took.
    """
    # 1. Fetch cutoffs and min/max scaling parameters from preloaded app_data
    cutoffs = app_data.get('predictive_cutoffs', {})
    c_min = cutoffs.get('c_min', 0.0)
    c_max = cutoffs.get('c_max', 1.0)
    
    # 2. Compute Priority Component
    priority_component = 1.0 if priority == 'High' else 0.3
    
    # 3. Compute Corridor Frequency Component
    # Fetch historical count for this corridor exactly as computed in backtest
    corridor_counts = cutoffs.get('corridor_counts', {})
    corridor_lookup_miss = corridor not in corridor_counts
    corridor_freq = corridor_counts.get(corridor, 0)
    
    # Min-Max Scale using the historical global min/max
    if c_max > c_min:
        # Bound it between 0 and 1 in case of unexpected unseen data
        freq_scaled = (corridor_freq - c_min) / (c_max - c_min)
        corridor_frequency_component = max(0.0, min(1.0, freq_scaled))
    else:
        corridor_frequency_component = 0.0
        
    # 4. Raw Score Formula
    predicted_severity_raw = (
        (priority_component * 0.5714) + 
        (corridor_frequency_component * 0.4286)
    ) * 100.0
    
    # 5. Bucket Assignment (Fixed Thresholds)
    # CRITICAL CONVENTION: This logic enforces a left-closed, right-open [a, b) binning.
    # We use strict `<` for the upper bounds so that exactly matching a threshold
    # falls into the higher bucket. E.g., a score of 60.00 fails `< t_low` (60.0)
    # and evaluates in `< t_med`, landing in Medium. This matches pd.cut(right=False)
    # in the backtest and prevents massive tied clusters from straddling boundaries.
    thresholds = cutoffs.get('thresholds', [60.0, 61.0, 66.0])
    t_low, t_med, t_high = thresholds
    
    if predicted_severity_raw < t_low:
        predicted_bucket = "Low"
    elif predicted_severity_raw < t_med:
        predicted_bucket = "Medium"
    elif predicted_severity_raw < t_high:
        predicted_bucket = "High"
    else:
        predicted_bucket = "Critical"
        
    contributing_factors = {
        "priority_component": priority_component,
        "corridor_frequency_component": corridor_frequency_component,
        "historical_corridor_volume": corridor_freq,
        "corridor_lookup_miss": corridor_lookup_miss
    }
        
    return predicted_bucket, round(predicted_severity_raw, 2), contributing_factors
