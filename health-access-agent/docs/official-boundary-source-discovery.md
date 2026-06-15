# Official Boundary Source Discovery

Date: 2026-06-15

Issue: [#9 Data: Find or onboard official district boundary polygons](https://github.com/MitchLeahy/not-so-standard-hackathon-team/issues/9)

## Outcome

No official district boundary polygon table is currently accessible in the Databricks workspace catalogs checked for this app.

An official source candidate was found, but it is not onboarded into Unity Catalog yet:

- Source: Survey of India Online Maps Portal
- Product: Administrative Boundary Database
- Product code: `OVSF/1M/7`
- Product description on portal: entire country up to district level with headquarters
- Format: shapefile
- Listed price for the single-user product: INR 0
- Product listing URL: `https://onlinemaps.surveyofindia.gov.in/Digital_Product_Show.aspx`
- Pricing/access policy URL: `https://onlinemaps.surveyofindia.gov.in/PricingPolicy.aspx`

The portal requires sign-in and may require the user's organization/account profile before download. Because the file is not already in the workspace and the current Codex session does not have a user-authenticated Survey of India portal session, the data issue remains blocked on manual source acquisition or an approved ingest path.

## Workspace Search Evidence

Accessible catalogs on 2026-06-15:

- `databricks_virtue_foundation_dataset_dais_2026`
- `workspace`
- `hackathon_health_lakebase`
- `samples`
- `system`

Catalog/table name search for boundary-like objects found only existing app and system tables:

- `workspace.default.hackathon_district_planning_serving`
- `workspace.default.hackathon_district_facilities_serving`
- `hackathon_health_lakebase.public.district_planning`
- `hackathon_health_lakebase.public.district_facilities`
- source NFHS district indicator table
- system/information-schema metadata tables

Column search for geometry-like fields found no official polygon, geometry, WKT, GeoJSON, or boundary column in the app-accessible source tables. Relevant geospatial columns remain point coordinates only:

- facility `latitude` / `longitude`
- pincode `latitude` / `longitude`
- derived facility drill-down `latitude` / `longitude`

## Onboarding Criteria

Before replacing the pincode-derived centroid/envelope proxy, an onboarded boundary dataset should meet these checks:

1. Geometry: district polygons or multipolygons, not just centroids.
2. Coverage: India district boundaries with state/UT names and district names.
3. Versioning: boundary vintage/date is known and can be compared with NFHS-5 district labels.
4. License: usage terms permit hackathon demo use and Databricks workspace storage.
5. Joinability: state/district keys can be canonicalized to `workspace.default.hackathon_health_indicators_serving`.
6. Format: source can be loaded into Unity Catalog as Delta with a geometry representation such as WKT, WKB, GeoJSON, or Databricks geospatial types.

## Proposed Ingest Path

Once the source file is downloaded and approved:

1. Store the raw shapefile package in a Unity Catalog volume.
2. Load it into a Delta table such as `workspace.default.india_district_boundaries_raw`.
3. Create a normalized serving view such as `workspace.default.india_district_boundaries_serving`.
4. Add canonical `state_key` and `district_key_name` fields using the same geography crosswalk as the planning view.
5. Compare NFHS district coverage before using polygons for assignment.
6. Replace pincode-derived envelopes only where official polygon joins are available; keep the current proxy as fallback.

## Current Product Impact

The app should continue labeling current district geography as a pincode-derived proxy. No polygon-backed facility assignment, catchment, or travel-time metric should be presented as official until an approved boundary table is onboarded and validated.
