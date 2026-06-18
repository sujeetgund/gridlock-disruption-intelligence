import os
import json
import pandas as pd
import numpy as np

def main():
    print("========================================")
    print("  CONSOLIDATED VALIDATION REPORT CARD")
    print("========================================")
    
    artifacts_dir = os.path.join(os.path.dirname(__file__), 'artifacts')
    clean_data_path = os.path.join(artifacts_dir, 'cleaned_data.parquet')
    scored_data_path = os.path.join(artifacts_dir, 'scored_data.parquet')
    confidence_path = os.path.join(artifacts_dir, 'model_confidence.json')

    all_passed = True

    def log_result(step, status, detail=""):
        nonlocal all_passed
        if status == "FAIL":
            all_passed = False
        print(f"[{status}] {step}" + (f": {detail}" if detail else ""))

    try:
        # STEP 1 CHECKS
        df = pd.read_parquet(clean_data_path)
        valid_duration = df['event_duration_hours'].dropna()
        if len(valid_duration) > 0 and 'severity_bucket' in df.columns:
            subset = df[df['event_cause'].isin(['vehicle_breakdown', 'pot_holes'])]
            crosstab = pd.crosstab(subset['event_cause'], subset['severity_bucket'])
            
            vb_low_med = crosstab.loc['vehicle_breakdown', 'Low'] + crosstab.loc['vehicle_breakdown', 'Medium']
            vb_total = crosstab.loc['vehicle_breakdown'].sum()
            ph_high_crit = crosstab.loc['pot_holes', 'High'] + crosstab.loc['pot_holes', 'Critical']
            ph_total = crosstab.loc['pot_holes'].sum()
            
            if (vb_low_med / vb_total > 0.8) and (ph_high_crit / ph_total > 0.5):
                log_result("Step 1: Data Cleaning & Bucketing", "PASS", "Domain skews match intuition (Breakdowns=Low/Med, Potholes=High/Crit)")
            else:
                log_result("Step 1: Data Cleaning & Bucketing", "FAIL", "Bucket skews violate domain intuition")
        else:
            log_result("Step 1: Data Cleaning", "FAIL", "Missing necessary columns or data")
    except Exception as e:
        log_result("Step 1: Data Cleaning", "FAIL", str(e))

    try:
        # STEP 2 CHECKS
        scored_df = pd.read_parquet(scored_data_path)
        std_dev = scored_df['severity_score'].std()
        corr = scored_df['severity_score'].corr(scored_df['event_duration_hours'])
        
        step2_pass = True
        issues = []
        if std_dev <= 5:
            step2_pass = False
            issues.append("Degenerate distribution")
        if not (0.35 <= corr <= 0.85):
            step2_pass = False
            issues.append(f"Correlation {corr:.2f} out of bounds")
            
        mean_scores = scored_df.groupby('event_cause')['severity_score'].mean()
        if mean_scores.get('pot_holes', 0) < mean_scores.get('vehicle_breakdown', 0):
            step2_pass = False
            issues.append("Intuition violated (pot_holes < vehicle_breakdown)")
            
        if step2_pass:
            log_result("Step 2: Severity Rule Engine", "PASS", f"Score spread={std_dev:.1f}, Corr={corr:.2f}")
        else:
            log_result("Step 2: Severity Rule Engine", "FAIL", ", ".join(issues))
            
    except Exception as e:
        log_result("Step 2: Severity Rule Engine", "FAIL", str(e))

    try:
        # STEP 3 CHECKS
        with open(confidence_path, 'r') as f:
            conf = json.load(f)
            
        is_reliable = conf.get('reliable', False)
        f1 = conf.get('macro_f1', 0.0)
        
        if is_reliable:
            log_result("Step 3: Predictive Model", "PASS", f"Model is reliable (Macro-F1: {f1:.3f})")
        else:
            log_result("Step 3: Predictive Model", "WARN", f"Model flagged as low-confidence/directional (Macro-F1: {f1:.3f}). Handled via UI fallback.")
            
    except Exception as e:
        log_result("Step 3: Predictive Model", "FAIL", str(e))

    print("\n========================================")
    if all_passed:
        print("  ALL GATES PASSED - READY FOR DEMO")
    else:
        print("  PIPELINE FAILED - DO NOT DEMO")
    print("========================================")

if __name__ == '__main__':
    main()
