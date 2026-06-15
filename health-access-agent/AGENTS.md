# Agent Notes

Use Databricks profile `hackathon2` and the local CLI at `~/.local/databricks-cli-1.3.0/bin/databricks`.

Set `DATABRICKS_AUTH_STORAGE=plaintext` for CLI calls in this repo because the workspace auth profile was created before the CLI 1.x cache migration.

Default workspace resources:

- App name: `health-access-agent`
- Lakebase project: `projects/hackathon-health`
- Lakebase branch: `projects/hackathon-health/branches/production`
- Lakebase database: `projects/hackathon-health/branches/production/databases/databricks-postgres`
- Lakebase endpoint: `projects/hackathon-health/branches/production/endpoints/primary`
- Synced table: `hackathon_health_lakebase.public.district_planning`
- Source view: `workspace.default.hackathon_district_planning_serving`

Before deployment, run:

```bash
npm run typecheck
npm run lint
npm run format
npm run lint:ast-grep
DATABRICKS_AUTH_STORAGE=plaintext ~/.local/databricks-cli-1.3.0/bin/databricks apps validate --profile hackathon2
```

Do not deploy without explicit user confirmation.
