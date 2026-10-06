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

## #115 — Super-admin "Company Activity" chart empty ✅ (shipped)

Live payloads (DevTools) resolved this. The BE returns `weekly-activities` as
`{ labels: string[], datasets: [{ name, values: number[] }] }` (7 series:
Solicitations, Evaluations, Vendors, Addendums, Contracts, Projects, MSA
Contracts) — NOT the legacy `{ solicitations[], evaluations[] }` item arrays
`transformWeeklyActivities` read. So it bucketed zero items → empty chart.

Fix (`lib/dashboardDataTransformer.ts`): detect the `{labels,datasets}` shape and
sum every dataset per label into the single `activities` series the "Company
Activity" area chart plots (`ChartCard` derives area series from the data keys).
Legacy item-array bucketing kept as a fallback. Test:
`lib/__tests__/weeklyActivities.unit.spec.ts` (3 cases).

Verification: vitest 3/3 ✓ · `tsc -b` exit 0 ✓ · eslint clean ✓. Commit `9ec9d5dcf`.

## #116 — Module usage empty on 30/7-day filters → BE-side (no FE change)

Live payloads show the FE is already correct:
- It requests `module-usage?range=30days` (filter label normalised correctly).
- BE returns the `{labels,datasets}` shape with **daily** labels ("Sep 06"…),
  which `transformModuleUsage` → `transformStackedBarData` already consumes, and
  `ChartCard`'s bar path renders a series per data key (not filtered by the
  config `selectors`). The 12-month view renders with real data.
- The 30-day payload's dataset **values are all zero** (DevTools screenshot), so
  the chart renders but every bar is zero-height → "shows nothing."

Conclusion: no FE bug found — the empty 30/7-day view is the BE returning
zero-valued daily buckets. **Ask BE** to confirm the daily module-usage
aggregation for `range=30days`/`7days` (the monthly series clearly has recent
activity, so all-zero daily buckets look like a BE aggregation gap).

## Out of scope

- Other tracker items; #135 target was the contract action log (ContractDetailPage Logs tab).
