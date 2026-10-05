---
quick_id: 261005-pe7
slug: fix-qa-115-116-135-super-admin-company-a
date: 2026-10-05
status: complete
commit: 21625f39b
---

# Summary — QA #115 / #116 / #135

## #135 — Contract action-log full export ✅ (shipped)

`layouts/ActionLogTabContent.tsx` built the export xlsx from `rows`, which is only
the current table page (pageSize 20) — a live contract with 100+ pages exported a
single page. Fixed:
- `handleExport` now fetches the full set in one request (`page: 1`,
  `limit: total`) honouring the active search filter, then exports all rows;
  falls back to the current page if the full fetch fails.
- Extracted `mapLogsToRows` / `toExportRow` so the export matches the on-screen
  columns; added an `isExporting` state ("Exporting…", button disabled).
- Test: `__tests__/qa135-action-log-export.test.tsx` asserts Export requests
  `limit = total` and writes all rows (not the 20-row page).

Verification: vitest 1/1 ✓ · `tsc -b` exit 0 ✓ · eslint `--max-warnings 0` clean ✓.

Commit: `21625f39b`.

## #115 / #116 — ⛔ Blocked on a BE payload sample (not shipped)

Investigated end-to-end; the FE wiring is correct:
- Chart ids map in `getChartData` (#115 `weekly-activities` → `transformWeeklyActivities`;
  #116 `module-usage` → `transformModuleUsage`).
- Filter labels `"30 days"` / `"7 days"` are normalised to `30days` / `7days`
  (`RoleBasedDashboard` `filter.replace(/\s+/g, "")`) and sent as `range`.
- `transformModuleUsage` already consumes both the legacy counts and the new
  labels/datasets shapes; `transformWeeklyActivities` buckets `solicitations` /
  `evaluations` items by `createdAt` within the selected window.

**Why blocked:** docs.json v2.3.0 does NOT document the `/companies/dashboard/*`
super-admin endpoints, so the live response shape (#115) and the daily-granularity
param BE expects (#116, "not making daily request") can't be verified from the
repo. These are "empty chart" bugs — shipping a speculative change we can't verify
would risk a wrong fix. Deferred pending a sample payload.

**To unblock (one ask to BE):**
- #115: a sample `GET /companies/dashboard/weekly-activities?range=12months` response
  (do the items carry `createdAt`? or is it `{labels,datasets}` / aggregated counts?).
- #116: what request yields daily module-usage for `range=30days`/`7days` — is it a
  separate param (e.g. `granularity=daily`) or a different `range` value?

## Out of scope

- Other tracker items; #135 target was the contract action log (ContractDetailPage Logs tab).
