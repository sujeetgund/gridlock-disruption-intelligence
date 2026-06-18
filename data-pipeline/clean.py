import pandas as pd
import numpy as np
import os

def main():
    # 1. Load astram_event_data.csv
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'astram_event_data.csv')
    df = pd.read_csv(csv_path)

    # Convert dates to UTC
    date_cols = ['start_datetime', 'end_datetime', 'closed_datetime', 'resolved_datetime']
    for col in date_cols:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce', utc=True)

    # 2. Create completion_time = closed_datetime filled with resolved_datetime
    if 'closed_datetime' in df.columns and 'resolved_datetime' in df.columns:
        df['completion_time'] = df['closed_datetime'].fillna(df['resolved_datetime'])
    elif 'closed_datetime' in df.columns:
        df['completion_time'] = df['closed_datetime']
    elif 'resolved_datetime' in df.columns:
        df['completion_time'] = df['resolved_datetime']

    # 3. Create event_duration_hours = (completion_time - start_datetime) in hours. Set negative values to NaN.
    if 'completion_time' in df.columns and 'start_datetime' in df.columns:
        df['event_duration_hours'] = (df['completion_time'] - df['start_datetime']).dt.total_seconds() / 3600.0
        df.loc[df['event_duration_hours'] < 0, 'event_duration_hours'] = np.nan

    # 4. Handle the skew.
    # Create log_duration = log1p(event_duration_hours)
    df['log_duration'] = np.log1p(df['event_duration_hours'])

    # Categorical severity_bucket informed by actual quantiles
    valid_durations = df['event_duration_hours'].dropna()
    quantiles = valid_durations.quantile([0.25, 0.5, 0.75, 0.95])
    print("Computed quantiles for event_duration_hours:")
    print(quantiles)

    q50 = round(quantiles[0.5], 1)
    q75 = round(quantiles[0.75], 1)
    q95 = round(quantiles[0.95], 1)

    bins = [-np.inf, q50, q75, q95, np.inf]
    # Fallback to exact quantiles if rounding caused non-unique bin edges
    if len(set(bins)) != len(bins):
        bins = [-np.inf, quantiles[0.5], quantiles[0.75], quantiles[0.95], np.inf]

    labels = ['Low', 'Medium', 'High', 'Critical']
    df['severity_bucket'] = pd.cut(df['event_duration_hours'], bins=bins, labels=labels)

    print("\nSeverity Bucket Counts:")
    print(df['severity_bucket'].value_counts(dropna=False))

    # 5. Fill missing corridor with "Non-corridor"
    if 'corridor' in df.columns:
        df['corridor'] = df['corridor'].fillna("Non-corridor")

    # 6. One-hot or frequency-encode event_cause, event_type, priority, requires_road_closure.
    # Doing frequency encoding for simplicity and tree-based model compatibility later
    cat_cols = ['event_cause', 'event_type', 'priority', 'requires_road_closure']
    for col in cat_cols:
        if col in df.columns:
            freq = df[col].value_counts(normalize=True)
            df[f'{col}_freq_encoded'] = df[col].map(freq).fillna(0)

    # 7. Extract time features from start_datetime: hour_of_day, day_of_week, is_weekend, month
    if 'start_datetime' in df.columns:
        df['hour_of_day'] = df['start_datetime'].dt.hour
        df['day_of_week'] = df['start_datetime'].dt.dayofweek
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['month'] = df['start_datetime'].dt.month

    # 8. Save cleaned data to artifacts/cleaned_data.parquet
    artifacts_dir = os.path.join(os.path.dirname(__file__), 'artifacts')
    os.makedirs(artifacts_dir, exist_ok=True)
    out_path = os.path.join(artifacts_dir, 'cleaned_data.parquet')
    df.to_parquet(out_path, index=False)

    print("\n--- Summary ---")
    print(f"Row count after cleaning: {len(df)}")
    valid_duration_pct = len(valid_durations) / len(df) * 100
    print(f"% rows with valid duration: {valid_duration_pct:.2f}%")

    engineered_cols = ['completion_time', 'event_duration_hours', 'log_duration', 'severity_bucket',
                       'hour_of_day', 'day_of_week', 'is_weekend', 'month'] + [f'{c}_freq_encoded' for c in cat_cols if c in df.columns]

    print("\nNull counts per engineered column:")
    for col in engineered_cols:
        if col in df.columns:
            print(f"{col}: {df[col].isna().sum()}")

    # Validation gate before Step 2:
    print("\n--- Validation Gate ---")
    print("\nseverity_bucket distribution:")
    print(df['severity_bucket'].value_counts())

    if 'event_cause' in df.columns:
        top_10_causes = df['event_cause'].value_counts().nlargest(10).index
        subset = df[df['event_cause'].isin(top_10_causes)]
        crosstab = pd.crosstab(subset['event_cause'], subset['severity_bucket'])
        print("\nCrosstab of severity_bucket x event_cause (Top 10 causes):")
        print(crosstab)

if __name__ == '__main__':
    main()
