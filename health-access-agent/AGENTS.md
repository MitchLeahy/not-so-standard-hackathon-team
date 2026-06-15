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

## Repository PR workflow

Use this workflow for new issues or feature/fix requests in this repository.

1. Start from an up-to-date `main`.

   ```bash
   git switch main
   git pull --ff-only origin main
   ```

2. Create a short-lived branch before making changes. Use the `codex/` prefix unless the user requests another branch name.

   ```bash
   git switch -c codex/<issue-slug>
   ```

3. Implement and verify the work on the branch. Prefer the narrowest meaningful checks first, then run the repo validation commands when the change is user-facing or deployment-sensitive.

4. Push the branch and open a PR against `main`.

   ```bash
   git push -u origin codex/<issue-slug>
   gh pr create --base main --head codex/<issue-slug> --title "<clear title>" --body "<summary and tests>"
   ```

5. If the PR cannot merge cleanly, resolve conflicts on the branch without destructive commands:

   ```bash
   git fetch origin
   git merge origin/main
   ```

   Edit conflicted files carefully, preserve user work, rerun relevant checks, commit the merge/conflict resolution, and push the branch again.

6. After verification passes and conflicts are resolved, merge back to `main` automatically. Do not pause for another confirmation unless checks fail, conflicts remain unresolved, deployment requires explicit approval, or the user explicitly asks for review before merge.

   ```bash
   gh pr merge --merge --delete-branch
   git switch main
   git pull --ff-only origin main
   ```

7. Do not force-push, reset `main`, or use destructive checkout/reset commands unless the user explicitly asks for that exact operation.
