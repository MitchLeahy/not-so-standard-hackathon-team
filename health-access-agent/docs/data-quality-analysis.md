# Data Quality Analysis

Date: 2026-06-15

This app currently reads from two synced Lakebase tables:

- `hackathon_health_lakebase.public.district_planning`
- `hackathon_health_lakebase.public.district_facilities`

Those tables are Lakebase snapshots of:

- `workspace.default.hackathon_district_planning_serving`
- `workspace.default.hackathon_district_facilities_serving`

Planner notes are stored separately in the app-owned Lakebase table `app_data.planner_notes`. The backend creates that table from the deployed app context so service-principal ownership stays with the app.

The serving view combines three raw Marketplace datasets from:

- `databricks_virtue_foundation_dataset_dais_2026.virtue_foundation_dataset`

## Dataset Inventory

| Dataset                                                   |     Rows | What it is                                                                                                                                                                                                                                           | How the app uses it                                                                                                                                                                                |
| --------------------------------------------------------- | -------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nfhs_5_district_health_indicators`                       |      706 | District-level NFHS-5 health and household indicators for India. Includes district/state labels, sample sizes, water/sanitation/fuel/insurance/literacy/birth/illness/anemia/BP/screening/tobacco percentages.                                       | Primary planning grain. Every app row is one NFHS district. The serving view computes `composite_need_score` from these indicators.                                                                |
| `facilities`                                              |   10,088 | Facility directory with names, source metadata, contact fields, address fields, type/operator, descriptive text, specialties/procedures/equipment/capabilities, social/web signals, and lat/lon. 10,000 rows are marked `address_country = 'India'`. | Aggregated into district counts by joining `address_stateOrRegion` to NFHS `state_ut` and `address_city` to NFHS `district_name`. Also computes mapped facility and maternal/child keyword counts. |
| `india_post_pincode_directory`                            |  165,627 | India Post office/pincode directory. Contains circle/region/division/office, pincode, office type, delivery flag, district, state name, and string lat/lon.                                                                                          | Aggregated into district counts by joining `statename` to NFHS `state_ut` and `district` to NFHS `district_name`.                                                                                  |
| `workspace.default.hackathon_health_indicators_serving`   |      706 | Serving view of the NFHS table with app-friendly column names.                                                                                                                                                                                       | Input to district planning serving view.                                                                                                                                                           |
| `workspace.default.hackathon_facilities_serving`          |   10,088 | Serving view of raw facility records.                                                                                                                                                                                                                | Not read directly by the backend API today; only summarized inside the district planning view.                                                                                                     |
| `workspace.default.hackathon_pincode_serving`             |  165,627 | Serving view of raw pincode records with generated `pincode_pk`.                                                                                                                                                                                     | Not read directly by the backend API today; only summarized inside the district planning view.                                                                                                     |
| `workspace.default.hackathon_district_planning_serving`   |      706 | Gold district-level serving view. Adds facility, mapped facility, maternal/child facility, postal office, pincode, composite need score, readiness, dedupe, and accessibility columns to NFHS districts.                                             | Synced into Lakebase for district overview, list, detail, and repair ledger reads.                                                                                                                 |
| `workspace.default.hackathon_district_facilities_serving` |    9,936 | Row-level facility evidence view keyed by district and deduped facility profile. Includes match method, duplicate grouping, readiness flags, quality warnings, and centroid distance estimates.                                                      | Synced into Lakebase for district facility drill-down reads.                                                                                                                                       |
| `hackathon_health_lakebase.public.district_planning`      |      706 | Lakebase synced copy of the gold district planning serving view.                                                                                                                                                                                     | Live table queried by `server/routes/health-planning-routes.ts` for district-level planning and impact metrics.                                                                                    |
| `hackathon_health_lakebase.public.district_facilities`    |    9,936 | Lakebase synced copy of the district facility evidence serving view.                                                                                                                                                                                 | Live table queried by `GET /api/districts/:districtKey/facilities`.                                                                                                                                |
| `app_data.planner_notes`                                  | App data | App-owned Lakebase table for planner notes/actions/statuses keyed to district.                                                                                                                                                                       | Live table used by planner note endpoints after app schema initialization in the deployed app context.                                                                                             |

## Lineage

`district_planning` is faithful to the Databricks serving view. A full outer comparison by `district_key` found:

- 706 joined rows
- 0 rows missing from Lakebase
- 0 rows missing from the serving view
- 0 mismatches in checked app metrics: `composite_need_score`, `facility_count`, and `postal_office_count`

So the app is not seeing sync drift. Current issues are upstream data quality and join logic issues.

## Key Issues

### 1. District/state joins lose a large share of facility and pincode data

The gold view joins by exact normalized text:

- facility `lower(trim(address_stateOrRegion)) = lower(trim(state_ut))`
- facility `lower(trim(address_city)) = lower(trim(district_name))`
- pincode `lower(trim(statename)) = lower(trim(state_ut))`
- pincode `lower(trim(district)) = lower(trim(district_name))`

Impact in the gold view:

- 380 of 706 districts have `facility_count = 0`
- 164 of 706 districts have `postal_office_count = 0`
- only 4,890 of 10,000 India facility rows match an NFHS district/state pair
- 46,100 of 165,627 pincode rows do not match an NFHS district/state pair
- 5963 distinct pincodes appear only in unmatched pincode rows

This is likely undercounting real assets rather than proving that those districts have no facilities or postal offices.

### 2. NFHS labels contain whitespace and spelling/version differences

The NFHS-derived serving table has unique keys and no nulls, but 704 of 706 rows have outer whitespace in `district_name` or `state_ut`.

Examples of cross-dataset label mismatches:

- NFHS uses `Maharastra`; facility and pincode data use `Maharashtra`.
- NFHS uses `Ahmadabad`; facility data commonly uses `Ahmedabad`.
- NFHS uses `Belgaum`; pincode data commonly uses `BELAGAVI`.
- NFHS uses `NCT of Delhi`; pincode/facility data uses `DELHI` / `Delhi`.
- Pincode uses administrative names like `24 PARAGANAS SOUTH`, `MEDINIPUR EAST`, `SPSR NELLORE`, while NFHS uses different district labels.

Concrete missed-match examples:

- `PUNE, MAHARASHTRA`: 801 pincode office rows unmatched because NFHS state is `Maharastra`.
- `Mumbai, Maharashtra`: 357 India facility rows unmatched because there is no exact NFHS district/city pair under the current join.
- `Ahmedabad, Gujarat`: 324 facility rows unmatched while NFHS has `Ahmadabad`.
- `Belagavi, Karnataka`: 721 pincode office rows unmatched while NFHS has `Belgaum`.

### 3. Facility data mixes city, district, and region fields

The current facility join treats `address_stateOrRegion` as a state and `address_city` as a district. The raw data does not consistently support that interpretation.

Signals:

- India facility rows have 234 distinct `address_stateOrRegion` values, far more than Indian states/UTs.
- Some rows use a district/region in `address_stateOrRegion`; for example `Alappuzha` with `address_city = Chengannur`.
- 7,649 of 10,000 India facility rows have `address_stateOrRegion` equal to an NFHS state/UT, but only 4,890 match both state and district/city.

This makes district facility counts uneven and heavily biased toward records whose `address_city` happens to equal an NFHS district label.

### 4. Facility geospatial data has invalid or suspicious coordinates

Among India facility rows:

- 30 rows are missing latitude or longitude.
- 6 rows have lat/lon outside a coarse India bounding box.
- 54 facility rows have blank names.
- 11 `unique_id` values are duplicated, affecting 22 rows.

Examples of invalid coordinates:

- Cura Imaging & Gastro Clinic, Nagpur: lat `2.95`, lon `41.39`
- Hzb Arogyam Multispeciality Hospital, Hazaribagh: lat `46.07`, lon `106.17`
- Sanjivani Multi Speciality Hospital, Chengannur/Alappuzha: lat `59.95`, lon `-38.26`
- Krishna Hospital Multispeciality, Lucknow: lat `-81.71`, lon `26.95`

These should be excluded or corrected before distance/travel-time planning.

### 5. Pincode lat/lon fields are strings and include bad values

The pincode serving view has no null lat/lon fields, but type/quality checks show:

- 12,015 rows have unparseable lat/lon values.
- 2,608 rows have parsed coordinates outside a coarse India bounding box.
- Coordinates are stored as strings, so downstream geospatial use requires explicit parsing and validation.

This matters if the app evolves from counts to catchment routing or distance estimates.

### 6. The live backend and frontend concept are out of sync

The backend reads only `public.district_planning` and returns district-level aggregates. The frontend concept copy references richer "Facility, pincode, NFHS, and notes tables", facility trust, contradictions, travel time, capacity, and planner actions.

Those richer concepts are currently hard-coded in `HealthPlanningPage.tsx`; they are not served from Lakebase or the Databricks views. Treat them as demo narrative, not current data-backed product behavior.

## Things That Look Healthy

- NFHS app-used indicator columns have no nulls.
- Checked percentage columns stay within 0-100.
- `district_key` is unique across all 706 NFHS/gold rows.
- The Lakebase synced table matches the serving view on row count and checked app metrics.
- `composite_need_score` is bounded in the current data from 20.05 to 53.31, with average 37.11.

## Repairs Applied

The measurable impact of each data repair is stored in the tracker below. UI work should reference this table when deciding what to surface, and data work should add a new row whenever a fix changes coverage, quality, accessibility, or persistence metrics.

## Improvement Impact Tracker

| Repair round                                                          | Impact metric                                   |  Before |         After |              Change | Where it appears in the demo                                       |
| --------------------------------------------------------------------- | ----------------------------------------------- | ------: | ------------: | ------------------: | ------------------------------------------------------------------ |
| Round 1: Alias and pincode-assisted matching                          | Districts with facility coverage                |     326 |           482 |                +156 | Coverage after repair, data repair ledger                          |
| Round 1: Alias and pincode-assisted matching                          | Districts with postal coverage                  |     542 |           624 |                 +82 | Coverage after repair                                              |
| Round 1: Alias and pincode-assisted matching                          | Matched facility records                        |   4,890 |         9,038 |              +4,148 | Coverage after repair, district evidence brief                     |
| Round 1: Alias and pincode-assisted matching                          | Matched postal office records                   | 119,527 |       142,194 |             +22,667 | Coverage after repair, district evidence brief                     |
| Round 2: District geo index and pincode coordinate validation         | Districts with facility coverage                |     482 |           497 |                 +15 | Coverage after repair, data repair ledger                          |
| Round 2: District geo index and pincode coordinate validation         | Matched facility records                        |   9,038 |         9,925 |                +887 | Coverage after repair, data repair ledger                          |
| Round 2: District geo index and pincode coordinate validation         | Coordinate fallback matches                     |       0 |           684 |                +684 | Data repair ledger, district evidence brief                        |
| Round 2: District geo index and pincode coordinate validation         | Valid postal coordinate rows surfaced           |       0 |       130,463 |            +130,463 | Data repair ledger, district evidence brief                        |
| Round 2: District geo index and pincode coordinate validation         | Invalid postal coordinate warnings surfaced     |       0 |        11,731 |             +11,731 | Data repair ledger, district evidence brief                        |
| Round 2: District geo index and pincode coordinate validation         | Valid matched pincodes surfaced                 |       0 |        17,762 |             +17,762 | District evidence brief                                            |
| Round 3: Boundary limitation, facility dedupe, and readiness signals  | Official boundary source availability           | Unknown | Not available |   Limitation logged | Data repair ledger, this document                                  |
| Round 3: Boundary limitation, facility dedupe, and readiness signals  | Deduped facility profiles surfaced              |   9,925 |         9,920 | -5 duplicate claims | Coverage after repair, data repair ledger                          |
| Round 3: Boundary limitation, facility dedupe, and readiness signals  | Duplicate facility records separated            |       0 |             5 |                  +5 | Coverage after repair, data repair ledger, district evidence brief |
| Round 3: Boundary limitation, facility dedupe, and readiness signals  | Service-ready facility profiles surfaced        |       0 |         9,891 |              +9,891 | Coverage after repair, data repair ledger, district evidence brief |
| Round 3: Boundary limitation, facility dedupe, and readiness signals  | Emergency-ready facility profiles surfaced      |       0 |         5,690 |              +5,690 | Data repair ledger, district evidence brief                        |
| Round 3: Boundary limitation, facility dedupe, and readiness signals  | Maternal/child-ready facility profiles surfaced |       0 |         6,870 |              +6,870 | Data repair ledger, district evidence brief                        |
| Round 3: Boundary limitation, facility dedupe, and readiness signals  | Facility quality signals counted                |       0 |       131,484 |            +131,484 | Data repair ledger, district evidence brief                        |
| Round 3: Boundary limitation, facility dedupe, and readiness signals  | Facility quality warnings counted               |       0 |         5,201 |              +5,201 | Coverage after repair, data repair ledger, district evidence brief |
| Round 4: Fuzzy dedupe, facility drill-downs, accessibility, and notes | Deduped facility profiles surfaced              |   9,920 |         9,914 | -6 duplicate claims | Coverage after repair, data repair ledger                          |
| Round 4: Fuzzy dedupe, facility drill-downs, accessibility, and notes | Duplicate facility records separated            |       5 |            11 |                  +6 | Coverage after repair, data repair ledger, district evidence brief |
| Round 4: Fuzzy dedupe, facility drill-downs, accessibility, and notes | District facility drill-down rows surfaced      |       0 |         9,936 |              +9,936 | District facility drill-down API                                   |
| Round 4: Fuzzy dedupe, facility drill-downs, accessibility, and notes | Districts with facility drill-down evidence     |       0 |           497 |                +497 | District facility drill-down API                                   |
| Round 4: Fuzzy dedupe, facility drill-downs, accessibility, and notes | Districts with accessibility estimates          |       0 |           621 |                +621 | Coverage after repair, district evidence brief                     |
| Round 4: Fuzzy dedupe, facility drill-downs, accessibility, and notes | Average nearest service-ready distance surfaced |       0 |      26.38 km |           +26.38 km | Coverage after repair, district evidence brief                     |
| Round 4: Fuzzy dedupe, facility drill-downs, accessibility, and notes | Average estimated travel time surfaced          |       0 |     67.48 min |          +67.48 min | Coverage after repair, district evidence brief                     |
| Round 4: Fuzzy dedupe, facility drill-downs, accessibility, and notes | Facility rows with centroid distance surfaced   |       0 |         9,427 |              +9,427 | District facility drill-down API                                   |
| Round 4: Fuzzy dedupe, facility drill-downs, accessibility, and notes | Planner note persistence contract               |       0 |             1 |                  +1 | Planner note API                                                   |

### Round 1: Alias and pincode-assisted matching

The first repair normalized state/district aliases and used pincode-assisted facility matching.

Measured impact:

- Districts with facility coverage improved from 326 to 482.
- Districts with postal coverage improved from 542 to 624.
- Matched facility records improved from 4,890 to 9,038.
- Matched postal office records improved from 119,527 to 142,194.

### Round 2: District geo index and pincode coordinate validation

The second repair builds a district geography index from valid India Post pincode coordinates. Facilities now resolve in this order:

1. Pincode majority district from the India Post directory.
2. Canonicalized city/district text.
3. Coordinate fallback to the nearest pincode-derived district envelope in the same canonical state.

The serving view also separates pincode/postal totals from geospatially usable rows.

Measured impact:

- Districts with facility coverage improved from 482 to 497.
- Matched facility records improved from 9,038 to 9,925.
- Coordinate fallback added 684 facility matches.
- Matched valid postal office coordinate rows are now surfaced: 130,463.
- Matched postal rows flagged as invalid or unusable for geospatial planning: 11,731.
- Valid matched pincodes are now surfaced: 17,762.

### Round 3: Boundary limitation, facility dedupe, and readiness signals

An information schema search for accessible district boundary, polygon, administrative shape, geography, or geo-index tables found no usable official boundary source beyond the existing NFHS and district planning tables. The app therefore keeps the pincode-derived district centroid/envelope as the current demo proxy and labels it as a limitation rather than presenting it as an official boundary join.

The third repair adds facility identity and readiness rollups at the district grain. Facility records now keep the existing matched-claim count, but also group likely duplicate claims by normalized facility name with pincode, then normalized facility name with rounded coordinates, then normalized name/address, with `cluster_id` and `unique_id` as fallbacks. Readiness signals are computed from facility type/operator, specialties, procedures, equipment, capability text, contact/web fields, doctors/capacity, and trust/presence fields.

Measured impact:

- Matched facility records remain visible as source claims: 9,925.
- Deduped facility profiles are now surfaced: 9,920.
- Duplicate facility records separated from planning counts: 5.
- Service-ready facility profiles surfaced: 9,891.
- Emergency-ready facility profiles surfaced: 5,690.
- Maternal/child-ready facility profiles surfaced: 6,870.
- Facility quality signals counted: 131,484.
- Facility quality warnings counted: 5,201.
- Districts with service-ready facility coverage: 497.

### Round 4: Fuzzy dedupe, facility drill-downs, accessibility, and notes

The fourth repair tightens facility entity resolution with a fuzzy normalized-name key before falling back to exact name/pincode, exact name/rounded-coordinate, name/address, `cluster_id`, and `unique_id`. It also adds the first row-level facility evidence table for district drill-downs, estimates nearest service-ready access using the pincode-derived district centroid proxy, and adds the backend contract for planner note persistence.

Measured impact:

- Deduped facility profiles changed from 9,920 to 9,914 after fuzzy duplicate grouping.
- Duplicate facility records separated from planning counts changed from 5 to 11.
- Facility drill-down evidence now surfaces 9,936 rows across 497 districts.
- Facility drill-down evidence includes 9,914 deduped profiles and 44 duplicate claim rows.
- Districts with accessibility estimates surfaced: 621.
- Average nearest service-ready facility distance surfaced: 26.38 km.
- Average estimated travel time surfaced: 67.48 minutes.
- Facility rows with district-centroid distance surfaced: 9,427.
- Planner notes now have API routes and an app-owned table contract; the deployed app initializes `app_data.planner_notes`.

## Recommended Fixes

1. Replace the pincode-derived district envelope with an official polygon boundary table if one is added to the workspace. A 2026-06-15 information schema search did not find an accessible district boundary, polygon, administrative shape, or geo table; the current approach is a demo-ready proxy, not a full administrative boundary join.
2. Expand the canonical geography crosswalk as new false negatives appear, especially for renamed districts and split districts.
3. Validate coordinates before any spatial use. Keep separate flags for missing, unparseable, outside India bounds, and geocoded confidence.
4. Continue improving dedupe beyond fuzzy normalized-name grouping. The current pass separates likely duplicate claims, but does not attempt full provider-network entity resolution.
5. Normalize pincode lat/lon into numeric columns in a serving view and exclude unparseable/out-of-bounds coordinates from routing/catchment features.
6. Expose uncertainty explicitly in the API. For example, return match coverage rates, unmatched counts, and a "data coverage warning" per district rather than only zero counts.
7. Add richer routing/catchment inputs if the app needs true travel-time planning. Current accessibility estimates use pincode-derived district centroids and a simple road-speed proxy.
8. Continue connecting the frontend to the new facility evidence and notes APIs so hard-coded CareGap Planner narrative is replaced by live Lakebase-backed behavior.

## Queries Used

High-level checks were run with Databricks CLI v1.3.0 and profile `hackathon2`, including:

- `discover-schema` for the raw tables, serving views, and Lakebase synced table
- `SHOW CREATE TABLE workspace.default.hackathon_district_planning_serving`
- row count comparisons across raw, serving, and synced datasets
- exact join coverage checks for facility and pincode records against NFHS districts
- coordinate parse/bounds checks
- NFHS null/range checks for app-used numeric columns
- full outer comparison between `workspace.default.hackathon_district_planning_serving` and `hackathon_health_lakebase.public.district_planning`
