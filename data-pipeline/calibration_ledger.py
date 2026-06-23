"""
calibration_ledger.py

Generates the Phase 2 calibration ledger by chronological replay.
Calculates error and bias between the Phase 1 Report-Time predictive score and the actual resolved severity score over time.
Outputs `calibration_summary.json` and `calibration_ledger.json` for dashboard consumption.
"""

import pandas as pd
import numpy as np
import os
import json

def main():
    artifacts_dir = os.path.join(os.path.dirname(__file__), 'artifacts')
    pred_path = os.path.join(artifacts_dir, 'predicted_data.parquet')
    clean_path = os.path.join(artifacts_dir, 'cleaned_data.parquet')
    
    if not os.path.exists(pred_path) or not os.path.exists(clean_path):
        print("Required parquets not found.")
        return
        
    df_pred = pd.read_parquet(pred_path)
    df_clean = pd.read_parquet(os.path.join(artifacts_dir, 'cleaned_data.parquet'))
    
    # 2. Join to get severity_bucket, corridor, and location data
    # Use id to join safely without string matching corridor names
    df = df_pred.merge(
        df_clean[['id', 'corridor', 'latitude', 'longitude', 'event_cause']], 
        on='id', 
        how='left'
    )
    
    # Drop rows without severity bucket (unresolved/no duration)
    # Also drop if missing other critical fields
    before_drop = len(df)
    df = df.dropna(subset=['predicted_bucket', 'severity_bucket', 'corridor', 'start_datetime'])
    dropped = before_drop - len(df)
    print(f"Dropped {dropped} records with NaN in buckets/corridor/date.")
    
    # Optional debug print for dropping concentration
    # print("Dropped concentration:")
    # print(df_pred.merge(df_clean[['id', 'corridor']], on='id', how='left')[
    #     df_pred.merge(df_clean[['id', 'corridor']], on='id', how='left')[['predicted_bucket', 'severity_bucket', 'corridor', 'start_datetime']].isna().any(axis=1)
    # ]['corridor'].value_counts().head(5))
        
    # 3. Recalculate predicted_bucket using the Phase 1 Report-Time formula
    import sys
    from pathlib import Path
    
    current_file_path = Path(__file__).resolve()
    project_dir = current_file_path.parent.parent
    sys.path.append(str(project_dir))
    
    from backend.scoring.predictive import calculate_predictive_score
    
    # Load the cutoffs directly.
    predictive_cutoffs_path = project_dir / 'data-pipeline' / 'artifacts' / 'predictive_cutoffs.json'
    with open(predictive_cutoffs_path, 'r') as f:
        cutoffs = json.load(f)
    
    mock_app_data = {'predictive_cutoffs': cutoffs}
    
    def get_phase1_bucket(row):
        bucket, _, _ = calculate_predictive_score(row['priority'], row['corridor'], mock_app_data)
        return bucket
        
    df = df.merge(df_clean[['id', 'priority']], on='id', how='left')
    df['predicted_bucket'] = df.apply(get_phase1_bucket, axis=1)

    # 4. Map categorical buckets to numeric ordinal values
    # Assuming equal spacing for distance metric
    bucket_map = {'Low': 0.0, 'Medium': 1.0, 'High': 2.0, 'Critical': 3.0}
    df['predicted_num'] = df['predicted_bucket'].astype(str).map(bucket_map)
    df['resolved_num'] = df['severity_bucket'].astype(str).map(bucket_map)
    
    # 4. Global sort by timestamp ascending
    df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
    df['closed_datetime'] = pd.to_datetime(df['closed_datetime'], errors='coerce')
    df = df.sort_values('start_datetime').reset_index(drop=True)
    
    # 5. Compute raw metrics per incident
    df['raw_abs_error'] = (df['predicted_num'] - df['resolved_num']).abs()
    df['raw_bias'] = df['predicted_num'] - df['resolved_num']
    
    # 6. Group by corridor and compute smoothed metrics
    def compute_corridor_metrics(group):
        group = group.sort_values('start_datetime')
        group['incident_seq_num'] = np.arange(1, len(group) + 1)
        group['rolling_error'] = group['raw_abs_error'].rolling(window=10, min_periods=1).mean()
        group['rolling_bias'] = group['raw_bias'].rolling(window=10, min_periods=1).mean()
        return group
        
    df_list = []
    for corridor, group in df.groupby('corridor'):
        group = compute_corridor_metrics(group)
        group['corridor'] = corridor
        df_list.append(group)
    
    df = pd.concat(df_list, ignore_index=True)
        
    # Final sort
    df = df.sort_values(['corridor', 'incident_seq_num'])
    
    # 7. Save ledger
    out_cols = [
        'id', 'corridor', 'incident_seq_num', 'start_datetime', 'closed_datetime',
        'predicted_bucket', 'severity_bucket', 'raw_abs_error', 
        'raw_bias', 'rolling_error', 'rolling_bias',
        'latitude', 'longitude', 'event_cause'
    ]
    
    df[out_cols].to_parquet(os.path.join(artifacts_dir, 'calibration_ledger.parquet'), index=False)
    
    # 7. Compute System-Wide Trend
    corridor_counts = df['corridor'].value_counts()
    
    summary = {
        "total_corridors": len(corridor_counts),
        "insufficient_history_corridors": int((corridor_counts < 15).sum()),
        "trend_eligible_corridors": int((corridor_counts >= 20).sum()),
        "system_wide_trend": {}
    }
    
    eligible_corridors = corridor_counts[corridor_counts >= 20].index
    
    first_10_errors = []
    first_10_biases = []
    last_10_errors = []
    last_10_biases = []
    
    for c in eligible_corridors:
        c_df = df[df['corridor'] == c].sort_values('incident_seq_num')
        
        # Raw unsmoothed metrics for the first 10
        first_10 = c_df.head(10)
        first_10_errors.extend(first_10['raw_abs_error'].tolist())
        first_10_biases.extend(first_10['raw_bias'].tolist())
        
        # Raw unsmoothed metrics for the last 10
        last_10 = c_df.tail(10)
        last_10_errors.extend(last_10['raw_abs_error'].tolist())
        last_10_biases.extend(last_10['raw_bias'].tolist())
        
    if first_10_errors:
        initial_error = float(np.mean(first_10_errors))
        final_error = float(np.mean(last_10_errors))
        initial_bias = float(np.mean(first_10_biases))
        final_bias = float(np.mean(last_10_biases))
        
        pct_change = ((final_error - initial_error) / initial_error) * 100 if initial_error > 0 else 0
        
        summary["system_wide_trend"] = {
            "initial_mean_abs_error": round(initial_error, 3),
            "final_mean_abs_error": round(final_error, 3),
            "error_pct_change": round(pct_change, 1),
            "initial_mean_bias": round(initial_bias, 3),
            "final_mean_bias": round(final_bias, 3),
            "status": "improved" if pct_change < -5 else ("worsened" if pct_change > 5 else "flat")
        }
        
    with open(os.path.join(artifacts_dir, 'calibration_summary.json'), 'w') as f:
        json.dump(summary, f, indent=2)
        
    print(f"Saved calibration_ledger.parquet ({len(df)} records)")
    print(f"Saved calibration_summary.json")
    print(json.dumps(summary, indent=2))

if __name__ == '__main__':
    main()
