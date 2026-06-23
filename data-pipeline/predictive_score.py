"""
predictive_score.py

Computes the Report-Time Predictive Score (Phase 1 logic).
This script uses only report-time available fields (Priority and Corridor Frequency) to generate a raw score and severity bucket.
Outputs predictive_cutoffs.json (for live API use) and predicted_data.parquet (for Phase 2 calibration replay).
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json

def main():
    base_dir = Path(__file__).resolve().parent
    artifacts_dir = base_dir / 'artifacts'
    clean_data_path = artifacts_dir / 'cleaned_data.parquet'
    
    if not clean_data_path.exists():
        print(f"Error: Could not find {clean_data_path}")
        return
        
    df = pd.read_parquet(clean_data_path)
    
    print(f"Loaded {len(df)} historical records for backtesting.")
    
    # 1. Compute Corridor Frequency Component (Min-Max scaled)
    # Use exact same methodology as original resolved score
    corridor_counts = df['corridor'].value_counts()
    corridor_freq = df['corridor'].map(corridor_counts)
    
    c_min = corridor_freq.min()
    c_max = corridor_freq.max()
    
    def min_max_scale(x):
        if c_max == c_min:
            return pd.Series(0, index=x.index)
        return (x - c_min) / (c_max - c_min)
        
    df['corridor_frequency_component'] = min_max_scale(corridor_freq)
    
    # 2. Compute Priority Component
    df['priority_component'] = df['priority'].apply(lambda x: 1.0 if x == 'High' else 0.3)
    
    # 3. Compute Predicted Severity Raw (0-100)
    # Weights: Priority 57.14%, Corridor 42.86%
    df['predicted_severity_raw'] = (
        (df['priority_component'] * 0.5714) + 
        (df['corridor_frequency_component'] * 0.4286)
    ) * 100
    
    # 4. Bucketing using Fixed Thresholds
    # Due to extremely low cardinality (25 unique values across 8k rows),
    # percentile-based bucketing fails (clusters cross thresholds). 
    # We use fixed raw score cutoffs instead.
    
    bins = [-np.inf, 60, 61, 66, np.inf]
    labels = ['Low', 'Medium', 'High', 'Critical']
    
    # CRITICAL CONVENTION: right=False forces [a, b) left-closed, right-open bins.
    # Do NOT change this to the pd.cut default (a, b]. The threshold 60.00 contains 
    # a massive tied cluster of 3,137 records. Using right=False ensures exactly 
    # 60.00 falls into Medium, preserving the intended distribution.
    df['predicted_bucket'] = pd.cut(df['predicted_severity_raw'], bins=bins, right=False, labels=labels)
    
    print("\n--- Validation Gate: Bucket Distribution ---")
    print(df['predicted_bucket'].value_counts(dropna=False))
    
    cutoffs = {
        'thresholds': [60.0, 61.0, 66.0],
        'c_min': float(c_min),
        'c_max': float(c_max),
        'corridor_counts': corridor_counts.to_dict()
    }
    
    with open(artifacts_dir / 'predictive_cutoffs.json', 'w') as f:
        json.dump(cutoffs, f, indent=2)
        
    print("\nSaved predictive_cutoffs.json")
    
    # Prepare the output dataset for Phase 2 replay engine
    out_cols = [
        'id', 'start_datetime', 'closed_datetime', 'resolved_datetime', 
        'predicted_severity_raw', 'predicted_bucket', 'severity_bucket'
    ]
    
    # severity_bucket is the resolved one computed in clean.py
    out_df = df[[c for c in out_cols if c in df.columns]]
    out_path = artifacts_dir / 'predicted_data.parquet'
    out_df.to_parquet(out_path, index=False)
    
    print(f"Saved {len(out_df)} records to predicted_data.parquet")

if __name__ == '__main__':
    main()
