# Feature Availability Audit (Phase 0)

## Schema Overview: `astram_event_data.csv`
Below are the 46 columns present in the dataset with their semantic meanings:

1. `id`: Unique identifier for the event
2. `event_type`: Planned or unplanned event
3. `latitude`: Start location latitude
4. `longitude`: Start location longitude
5. `endlatitude`: End location latitude (for stretches)
6. `endlongitude`: End location longitude (for stretches)
7. `address`: Text description of the start location
8. `end_address`: Text description of the end location
9. `event_cause`: Core classification (e.g., vehicle_breakdown, tree_fall, pot_holes)
10. `requires_road_closure`: Boolean flag indicating if the event ultimately required a road closure
11. `start_datetime`: When the event technically began
12. `end_datetime`: When the event ended
13. `status`: Current lifecycle state (e.g., active, closed, resolved)
14. `authenticated`: Boolean indicating if the report is verified
15. `modified_datetime`: Last time the record was updated
16. `map_file`: Associated map asset reference
17. `direction`: Traffic flow direction
18. `description`: Free-text field describing the incident
19. `veh_type`: Type of vehicle involved (if applicable)
20. `veh_no`: Registration number of the vehicle
21. `corridor`: Standardized major road corridor name (e.g., "Mysore Road")
22. `priority`: Assigned urgency level ("High" or "Low")
23. `cargo_material`: What the truck/vehicle is carrying
24. `reason_breakdown`: Specific mechanical issue
25. `age_of_truck`: Vehicle age in years
26. `created_date`: Timestamp when the incident was logged in the system
27. `route_path`: GeoJSON or polyline mapping the stretch
28. `client_id`: Source system/client
29. `created_by_id`: User who logged the event
30. `last_modified_by_id`: User who last updated the event
31. `assigned_to_police_id`: Officer dispatched
32. `citizen_accident_id`: Reference ID if reported by a citizen
33. `comment`: Additional operator notes
34. `police_station`: Jurisdiction handling the event
35. `meta_data`: Additional JSON properties
36. `kgid`: Internal reference ID
37. `resolved_at_address`: Location where resolution happened
38. `resolved_at_latitude`: Resolution latitude
39. `resolved_at_longitude`: Resolution longitude
40. `closed_by_id`: User who closed the ticket
41. `closed_datetime`: Timestamp when ticket was closed
42. `resolved_by_id`: User who resolved the ticket on ground
43. `resolved_datetime`: Timestamp when incident was cleared
44. `gba_identifier`: Geofence or bounding box ID
45. `zone`: City administrative zone
46. `junction`: Specific junction name if applicable

## Scoring Factors & Report-Time Availability

To build a predictive score that avoids label leakage, we must only use fields that are genuinely available at the moment the event is created.

**1. Duration (Derived from `closed_datetime` / `resolved_datetime` and `start_datetime`) -> EXCLUDE**
- **Availability:** Never available at report time. It is computed retrospectively.
- **Decision:** Excluded from predictive scoring.

**2. Requires Road Closure (`requires_road_closure`) -> EXCLUDE**
- **Availability:** Not available at logging.
- **Evidence:** Analysis of historical records shows that for events where `requires_road_closure == True`, the median time between `created_date` and `modified_datetime` is 125.38 minutes. This concrete evidence indicates the field is predominantly populated post-triage or at closure. Using it at report time would constitute label leakage.
- **Decision:** Excluded from predictive scoring.

**3. Priority (`priority`) -> INCLUDE**
- **Availability:** Assigned exactly at the moment of logging.
- **Evidence:** Out of 222 historical events modified within 1 minute of their `created_date` (i.e., immediately upon creation with virtually no triage window), 100% of them (222/222) possessed a non-null `priority` (122 High, 100 Low). This confirms priority is populated simultaneously with event creation.
- **Data Quality Note:** The full 8,173-row dataset contains exclusively 'High' (5030), 'Low' (3141), and NaN (2) values. The 2 records with `NaN` are silently assigned to the 'otherwise' bucket (0.3) by the binary encoder, effectively treating them as 'Low' priority.
- **Decision:** Included in predictive scoring.

**4. Corridor Frequency (Derived from `corridor`) -> INCLUDE**
- **Availability:** The `corridor` name is part of the location data entered at logging. The frequency is a pre-calculated historical aggregate.
- **Decision:** Included in predictive scoring.

## Conclusion & Action
The Phase 1 Predictive Severity Score will rely exclusively on **Priority** and **Corridor Frequency**, renormalizing the weights to 57.14% and 42.86% respectively, completely eliminating `duration` and `requires_road_closure` to ensure strict real-time validity.

### Note on Pre-Processing and Bucketing
The raw predictive score (0-100) intentionally omits a `log1p` transformation and population-based quantile bucketing.
- **Evidence:** Analysis of the full 8,173 records revealed extremely low cardinality for the predictive score (only 25 unique values). The formula relies solely on two inputs (a binary priority and a fixed corridor frequency), meaning thousands of records inevitably tie at exact thresholds. Using strict percentiles caused massive tied clusters to arbitrarily fall into adjacent buckets.
- **Decision (Natural Breaks Methodology):** To guarantee deterministic classification and ensure that no identically-scored events straddle a bucket boundary, we implemented strict, absolute numerical thresholds (`[60.0, 61.0, 66.0]`). These cutoffs were explicitly placed at the largest natural gaps in the unique score distribution:
  - **Cutoff 66.0:** Placed in the 1.83-point gap between `65.17` and `67.00` (separating Critical from High).
  - **Cutoff 61.0:** Placed in the 1.11-point gap between `60.88` and `61.99` (separating High from Medium).
  - **Cutoff 60.0:** Placed precisely to isolate the single largest tied cluster (`60.00`, 3,137 records) from everything below it (`59.66`), serving as the stable boundary for the Medium bucket.

> [!WARNING]
> Because the predictive severity score is stripped down to just two report-time fields, its resolution is inherently coarse. Two incidents on the exact same corridor with the identical priority will always receive the identical predicted bucket. This is an intended consequence of strictly avoiding post-resolution label leakage. 
> 
> **Phase 2 Calibration Impact:** In Phase 2, the replay engine shows a system-wide Mean Absolute Error (MAE) of ~1.0. Because our ordinal mapping uses a 0–3 scale, an MAE of 1.0 means predictions are, on average, off by about one full severity bucket. This meaningfully weak result is a direct, honest consequence of the structural coarseness documented here in Phase 1 (relying on only 2 inputs resulting in 25 unique scores).
>
> **Missing Duration (Data Quality):** To evaluate calibration, we dropped ~61% of historical records because they lacked a valid `event_duration_hours` (and therefore a resolved severity bucket). Temporal analysis proved this drop is incredibly stable (~60% every single month) and the surviving dataset extends up to the final 6 hours of the full dataset. This confirms the missing data is a chronic historical tracking limitation in the source system, not an artifact of recent incidents remaining open.
