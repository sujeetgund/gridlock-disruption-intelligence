# Disruption Impact & Response Intelligence System - Methodology

## Explainability & Limitations

### 1. The High Bucket Coarseness
The rule-based and predictive models segment severity into 4 buckets. However, due to the right-skewed log-normal distribution of actual clearance times, the `High` bucket spans a massive range from **5.5 to 639.9 hours**.
**Operational Precedence:** The machine learning severity bucket acts as a directional risk indicator. The primary operational driver for deployment and clearance time recommendations is the historical median duration for the given `event_cause` + `corridor` combination from the Step 2 rule engine.

### 2. Survivorship Bias in Fast-Resolving Incidents
Categories like `accident` and `congestion` show high proportions of open/unresolved cases (~75-80% missing completion time) relative to `vehicle_breakdown`. Consequently, duration predictions for these causes may lack representativeness.

### 3. Machine Learning Limitations (Macro-F1 < 0.5)
The LightGBM classification model correctly flags its own confidence as low based on its Macro-F1 score (`0.47`). 
**Critical vs High Distinction:** The model's primary error mode is under-distinguishing `High` vs `Critical` (predicting High for Critical events), not failing to detect severity altogether. Operationally, this failure mode is safer, since both `High` and `Critical` result in significant escalated responses.

## UI Response Hierarchy
When serving predictions from `/api/predict`, the frontend will prioritize the rule-based median duration and calculated scores. The ML severity bucket will be presented strictly as a secondary "directional read" badge, accompanied by an explicit low-confidence flag when the `reliable: false` artifact is triggered.
