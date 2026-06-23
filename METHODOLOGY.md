# Disruption Impact & Response Intelligence System - Methodology

## Explainability & Limitations

### 1. The High Bucket Coarseness
The rule-based and predictive models segment severity into 4 buckets. However, due to the right-skewed log-normal distribution of actual clearance times, the `High` bucket spans a massive range from **5.5 to 639.9 hours**.

**Operational Precedence:** The machine learning severity bucket acts as a directional risk indicator. The primary operational driver for deployment and clearance time recommendations is the historical median duration for the given `event_cause` + `corridor` combination from the Step 2 rule engine.

### 2. Survivorship Bias in Fast-Resolving Incidents
Categories like `accident` and `congestion` show high proportions of open/unresolved cases (~75-80% missing completion time) relative to `vehicle_breakdown`. Consequently, duration predictions for these causes may lack representativeness.

### 3. Machine Learning Limitations (Macro-F1 < 0.5)
The LightGBM classification model correctly flags its own confidence as low based on its Macro-F1 score (`0.477`). 

*The ML feature set was audited against the same report-time availability standard applied to the rule-based score (see `FEATURE_AVAILABILITY.md`); `requires_road_closure` was identified and removed during this process.* 
**Critical vs High Distinction:** The model's primary error mode is under-distinguishing `High` vs `Critical` (predicting High for Critical events), not failing to detect severity altogether. Operationally, this failure mode is safer, since both `High` and `Critical` result in significant escalated responses.

### 4. Corridor Lookup Fallback
*Unrecognized corridor names entered via the simulation form default the frequency component to 0.0 and surface an explicit on-screen warning per affected prediction, rather than failing silently or crashing.*

## Rule Engine Formulas

> [!NOTE]
> Bucket labels (Low/Medium/High/Critical) are shared terminology across two distinct systems on different scales. The duration-based edges below classify the Historical Baseline (`display_severity_bucket`) and the Resolved Severity score, both measured in hours. The Report-Time Predictive Score uses a separate natural-break cutoff system on a 0–100 point scale (see `FEATURE_AVAILABILITY.md`, "Note on Pre-Processing and Bucketing") — the two cutoff sets are not directly comparable and bucket the same incident independently.

### Severity Bucket Edges (Calculated from Valid Durations)
- **Low**: < 1.1 hours
- **Medium**: 1.1 to 5.5 hours
- **High**: 5.5 to 639.9 hours
- **Critical**: > 639.9 hours

### Resource Engine Formula
The recommended base officer count is derived directly from the corridor's historical risk profile, specifically its share of high-priority events, anchored by the `corridor_lookup.json` from Step 2.
- **Base Officers**: `2`
- **Risk Premium**: `+ int((corridor_high_priority_events / max_high_priority_across_all_corridors) * 4)`
- **Current Event Premium**: `+ 2` if the active event priority is "High"

## UI Response Hierarchy & Precedence
When serving predictions from `/api/predict`, the API returns two distinct buckets to enforce the rule-engine precedence structurally in the data:
1. `display_severity_bucket`: The definitive operational severity. Computed strictly by passing the **rule-based median duration** (for the cause+corridor) through the exact bucket edges above. The frontend must bind all primary UI colors and badges to this value.
2. `ml_severity_bucket`: The raw output of the ML model, presented strictly as a secondary "directional read" annotation, accompanied by an explicit low-confidence flag when `reliable: false`.
