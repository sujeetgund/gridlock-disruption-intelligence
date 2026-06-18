from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import pandas as pd
import json
import joblib
import os

from .routers import events, predict

# In-memory storage for loaded artifacts
app_data = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load all models and data at startup
    base_dir = os.path.dirname(os.path.dirname(__file__))
    artifacts_dir = os.path.join(base_dir, 'data-pipeline', 'artifacts')
    
    # 1. Load ML Model
    model_path = os.path.join(artifacts_dir, 'model.pkl')
    if os.path.exists(model_path):
        app_data['model'] = joblib.load(model_path)
        
    # 2. Load Model Confidence
    conf_path = os.path.join(artifacts_dir, 'model_confidence.json')
    if os.path.exists(conf_path):
        with open(conf_path, 'r') as f:
            app_data['model_confidence'] = json.load(f)
            
    # 3. Load Corridor Lookup
    corr_path = os.path.join(artifacts_dir, 'corridor_lookup.json')
    if os.path.exists(corr_path):
        with open(corr_path, 'r') as f:
            app_data['corridors'] = json.load(f)
            # Find the max high_priority_count to scale resource rules
            app_data['max_high_priority_events'] = max([c.get('high_priority_count', 0) for c in app_data['corridors']])
            
    # 4. Precompute median duration lookup table by cause + corridor
    clean_data_path = os.path.join(artifacts_dir, 'cleaned_data.parquet')
    if os.path.exists(clean_data_path):
        df = pd.read_parquet(clean_data_path)
        
        # Precompute median duration by cause + corridor
        valid_df = df.dropna(subset=['event_duration_hours'])
        app_data['median_duration_combo'] = valid_df.groupby(['event_cause', 'corridor'])['event_duration_hours'].median().to_dict()
        app_data['count_combo'] = valid_df.groupby(['event_cause', 'corridor']).size().to_dict()
        app_data['median_duration_cause'] = valid_df.groupby('event_cause')['event_duration_hours'].median().to_dict()
        app_data['count_cause'] = valid_df.groupby('event_cause').size().to_dict()
        
        # Precompute Map Sample (Stratified by severity_bucket)
        if 'severity_bucket' in df.columns:
            # We want around 1000 points. Let's sample proportional to severity bucket.
            # Only rows with valid latitude and longitude
            map_df = valid_df.dropna(subset=['latitude', 'longitude']).copy()
            if len(map_df) > 1000:
                # Group by severity_bucket and sample proportionally
                frac = 1000 / len(map_df)
                map_sample = map_df.groupby('severity_bucket').sample(frac=frac, random_state=42)
            else:
                map_sample = map_df
                
            # If severity_score was computed, it would be in scored_data.parquet.
            # We will recalculate it or just pass 0 if missing. 
            # But the map needs severity_score for colors/sizing. We can just use the bucket to color it.
            records = []
            for _, row in map_sample.iterrows():
                row_dict = row.to_dict()
                records.append({
                    "latitude": row_dict.get('latitude'),
                    "longitude": row_dict.get('longitude'),
                    "severity_score": row_dict.get('severity_score', 0.0),
                    "cause": row_dict.get('event_cause'),
                    "corridor": row_dict.get('corridor'),
                    "severity_bucket": row_dict.get('severity_bucket', 'Unknown')
                })
            app_data['map_events'] = records

    yield
    # Clean up
    app_data.clear()

app = FastAPI(lifespan=lifespan, title="Gridlock Disruption API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For hackathon, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router, prefix="/api")
app.include_router(predict.router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Gridlock Backend Running"}
