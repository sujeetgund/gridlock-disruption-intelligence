import pandas as pd
import numpy as np
import os

def main():
    csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'astram_event_data.csv')
    df = pd.read_csv(csv_path)

    # Convert dates to UTC
    date_cols = ['start_datetime', 'end_datetime', 'closed_datetime', 'resolved_datetime']
    for col in date_cols:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce', utc=True)

    if 'closed_datetime' in df.columns and 'resolved_datetime' in df.columns:
        df['completion_time'] = df['closed_datetime'].fillna(df['resolved_datetime'])
    elif 'closed_datetime' in df.columns:
        df['completion_time'] = df['closed_datetime']
    elif 'resolved_datetime' in df.columns:
        df['completion_time'] = df['resolved_datetime']

    if 'completion_time' in df.columns and 'start_datetime' in df.columns:
        df['event_duration_hours'] = (df['completion_time'] - df['start_datetime']).dt.total_seconds() / 3600.0
        df.loc[df['event_duration_hours'] < 0, 'event_duration_hours'] = np.nan

    valid_durations = df['event_duration_hours'].dropna()
    quantiles = valid_durations.quantile([0.25, 0.5, 0.75, 0.95])

    q50 = round(quantiles[0.5], 1)
    q75 = round(quantiles[0.75], 1)
    q95 = round(quantiles[0.95], 1)

    bins = [-np.inf, q50, q75, q95, np.inf]
    if len(set(bins)) != len(bins):
        bins = [-np.inf, quantiles[0.5], quantiles[0.75], quantiles[0.95], np.inf]

    print("--- 4. Bucket Edges ---")
    print(f"Edges used for bucketing (hours): {bins}")
    
    # 1. Why are 4981 rows NaN for duration?
    print("\n--- 1. NaN Duration Analysis ---")
    nan_dur_mask = df['event_duration_hours'].isna()
    
    # Is it because start_datetime is missing, completion_time is missing, or duration was negative?
    missing_start = df.loc[nan_dur_mask, 'start_datetime'].isna().sum()
    missing_completion = df.loc[nan_dur_mask, 'completion_time'].isna().sum()
    
    # Check if negative duration was the issue
    if 'completion_time' in df.columns and 'start_datetime' in df.columns:
        raw_duration = (df['completion_time'] - df['start_datetime']).dt.total_seconds() / 3600.0
        negative_duration_count = (raw_duration < 0).sum()
    else:
        negative_duration_count = 0
        
    print(f"Total NaN durations: {nan_dur_mask.sum()}")
    print(f"Missing start_datetime: {missing_start}")
    print(f"Missing completion_time (still open): {missing_completion}")
    print(f"Negative duration coerced to NaN: {negative_duration_count}")
    
    # 2. Crosstab of event_cause x valid_duration_flag
    print("\n--- 2. Valid Duration Coverage by Cause ---")
    df['has_valid_duration'] = ~df['event_duration_hours'].isna()
    coverage = pd.crosstab(df['event_cause'], df['has_valid_duration'])
    # Calculate percentage
    coverage['pct_valid'] = (coverage[True] / (coverage[True] + coverage[False]) * 100).round(1)
    print(coverage)
    
    # 3. Confirm 116 start_datetime nulls match hour_of_day nulls
    print("\n--- 3. start_datetime parsing check ---")
    df['hour_of_day'] = df['start_datetime'].dt.hour
    hour_nulls = df['hour_of_day'].isna()
    start_dt_nulls = df['start_datetime'].isna()
    
    match = (hour_nulls == start_dt_nulls).all()
    print(f"Total hour_of_day nulls: {hour_nulls.sum()}")
    print(f"Total start_datetime nulls: {start_dt_nulls.sum()}")
    print(f"Do the nulls exactly match? {match}")

if __name__ == '__main__':
    main()
