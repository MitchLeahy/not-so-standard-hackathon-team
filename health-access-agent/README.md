# CareGap Planner

Databricks Apps & Agents for Good Hackathon project for evidence-backed healthcare access planning across Indian districts.

The app uses:

- Databricks Apps + AppKit for the React/TypeScript application
- Lakebase Postgres for low-latency app reads
- A Lakebase snapshot synced table built from the DAIS hackathon Marketplace dataset

## What it does

CareGap Planner helps planners find medical deserts, inspect the evidence behind each gap, and turn the finding into a concrete verification, routing, or partnership action. The current demo focuses on three care tracks: maternal emergency care, dialysis access, and trauma stabilisation.

The UI surfaces:

- Priority gap queue by care track
- Map-style access view with trusted and uncertain facility signals
- Need, access, and trust scores
- Facility trust desk with extracted service claims
- Evidence-backed planner brief
- Clickable planner actions with estimated people reached, coverage lift, and trust lift
- Explicit uncertainty around facility matching and claimed service capacity

## Databricks resources

CLI profile:

```bash
hackathon2
```

Workspace:

```text
https://dbc-1928825b-120a.cloud.databricks.com
```

Lakebase project:

```text
projects/hackathon-health
```

Lakebase branch:

```text
projects/hackathon-health/branches/production
```

Lakebase database:

```text
projects/hackathon-health/branches/production/databases/databricks-postgres
```

Synced table:

```text
hackathon_health_lakebase.public.district_planning
```

Source serving view:

```text
workspace.default.hackathon_district_planning_serving
```

Original dataset:

```text
databricks_virtue_foundation_dataset_dais_2026.virtue_foundation_dataset
```

## Local development

Use Node.js 22+.

```bash
npm install
npm run dev
```

The generated `.env` points at the created Lakebase endpoint for local development. It does not contain a database password or token.

## Validation

Run the local checks:

```bash
npm run typecheck
npm run lint
npm run format
npm run lint:ast-grep
```

Run Databricks App validation:

```bash
DATABRICKS_AUTH_STORAGE=plaintext ~/.local/databricks-cli-1.3.0/bin/databricks apps validate --profile hackathon2
```

## Deployment

Deploying updates workspace app resources, so confirm before running:

```bash
DATABRICKS_AUTH_STORAGE=plaintext ~/.local/databricks-cli-1.3.0/bin/databricks apps deploy --profile hackathon2
```

After the first deploy, get the app service principal:

```bash
DATABRICKS_AUTH_STORAGE=plaintext ~/.local/databricks-cli-1.3.0/bin/databricks apps get health-access-agent --profile hackathon2 -o json
```

Then grant it read access to the synced table in Lakebase:

```sql
GRANT USAGE ON SCHEMA public TO "<SP_CLIENT_ID>";
GRANT SELECT ON ALL TABLES IN SCHEMA public TO "<SP_CLIENT_ID>";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO "<SP_CLIENT_ID>";
```

## Notes

Free Edition currently allows one active `DATABASE_TABLE_SYNC` pipeline in this workspace. To stay within that quota, the app syncs one district-level gold table rather than three raw tables.
