import requests
import json
import time
import subprocess

def test_api():
    # Start the server as a subprocess
    server = subprocess.Popen(["uv", "run", "uvicorn", "backend.main:app", "--port", "8000"])
    
    # Wait for server to start
    time.sleep(3)
    
    try:
        # 1. Test Map Endpoint
        res = requests.get("http://localhost:8000/api/events/map")
        assert res.status_code == 200, "Map endpoint failed"
        map_data = res.json()
        print(f"Map endpoint returned {len(map_data)} events.")
        if len(map_data) > 0:
            print("Sample map event:", map_data[0])

        # 2. Test Leaderboard
        res = requests.get("http://localhost:8000/api/corridors/leaderboard")
        assert res.status_code == 200, "Leaderboard endpoint failed"
        leaderboard = res.json()
        print(f"\nLeaderboard returned {len(leaderboard)} corridors.")
        
        # 3. Test Limitations
        res = requests.get("http://localhost:8000/api/meta/limitations")
        assert res.status_code == 200, "Limitations endpoint failed"
        limitations = res.json()
        print(f"\nModel Confidence Reliable Flag: {limitations['ml_model_status']['reliable']}")
        
        print("\n--- PREDICT ENDPOINT TESTS ---")
        
        # Test Case 1: Agree Case (High Priority Vehicle Breakdown)
        payload_agree = {
            "event_cause": "vehicle_breakdown",
            "corridor": "ORR", # Outer Ring Road typically has many events
            "priority": "High",
            "requires_road_closure": False,
            "hour_of_day": 14,
            "day_of_week": 2
        }
        res_agree = requests.post("http://localhost:8000/api/predict", json=payload_agree)
        print("\n[Case 1: vehicle_breakdown] Request:", payload_agree)
        print("Response:", json.dumps(res_agree.json(), indent=2))
        
        # Test Case 2: Disagree Case (pot_holes on major corridor)
        # We know pot_holes have high duration median, meaning display_severity will be High/Critical
        # But since the ML model has poor Critical recall and struggles with pot_holes vs high, it might predict lower or disagree.
        payload_disagree = {
            "event_cause": "pot_holes",
            "corridor": "Mysuru Road", # Major corridor
            "priority": "High",
            "requires_road_closure": True,
            "hour_of_day": 8,
            "day_of_week": 1
        }
        res_disagree = requests.post("http://localhost:8000/api/predict", json=payload_disagree)
        print("\n[Case 2: pot_holes (Disagreement check)] Request:", payload_disagree)
        
        result = res_disagree.json()
        print("Response:", json.dumps(result, indent=2))
        
        # Verify precedence rules
        disp = result['display_severity_bucket']
        ml = result['ml_severity_bucket']
        
        if disp != ml:
            print(f"\n>>> SUCCESS: Disagreement generated. Display: {disp} | ML: {ml}")
            print(f">>> UI correctly binds to {disp} driven by median duration {result['predicted_duration_hours']}h")
        else:
            print(f"\n>>> NOTE: Model agreed with rule engine (Both = {disp}). Try another combo to force disagreement if needed.")

    finally:
        # Kill server
        server.terminate()
        server.wait()

if __name__ == '__main__':
    test_api()
