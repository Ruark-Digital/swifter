---
quick_id: 261005-tq6
slug: qa-102-wire-view-only-contracts-list-to
date: 2026-10-05
status: complete
commit: 7e26d7b73
---

# Summary — QA #102 view-only Contracts list

## Shipped ✅ (commit 7e26d7b73)

**Contracts list (the concrete half of #102).** View-only users saw no contracts
because `isContractVendorLike = isVendor || isProjectManager` excludes them, so
they fell into the manager contracts layout whose queries
(`/contract/manager/contracts*`) 403 for view-only — and that layout also showed a
"My Contracts" tab they can't populate.

- Added `useViewOnlyContracts` / `useViewOnlyContractsStats` →
  `/contract/user/contracts` and `/contract/user/contracts/stats` (same
  `ApiResponseContractServiceList` / stats shape as the manager read view, confirmed
  in docs.json v2.3.0).
- `managerQueriesEnabled = !isContractVendorLike && !isApprover && !isViewOnly` —
  view-only no longer fires the manager queries.
- View-only now renders a single read-only "All Contracts" table fed by the
  `/user` data, routed through the company-admin branch (`isCompanyAdmin || isViewOnly`).
  No "My Contracts" tab (also closes the contracts side of #103).
- Stat cards + rows reuse the existing `mapContractsToRows` / `statsCounts`.

Verification: `tsc -b` exit 0 (Vercel gate) ✓ · eslint `--max-warnings 0` on
index.tsx clean ✓. (The page imports react-pdf transitively, so it is not
unit-testable under jsdom; Playwright isn't run in this env. The change is a
straightforward role-gated endpoint swap reusing existing mappers — recommend QA
spot-check against staging, where `/user/contracts` is already live.)

## Dashboard half of #102 — ⛔ BE-blocked

`viewOnlyConfig = contractManagerConfig`, but `useDashboardData` gates every
contract-dashboard query on `isContractDashboardRole` (contract_manager / approver /
procurement / company_admin — NOT view_only), and there are no
`/user/.../dashboard/*` endpoints. So the view-only dashboard renders the CM shell
with no data and cannot be populated from the FE.

**To unblock:** BE needs view-only dashboard endpoints (e.g.
`/contract/user/contracts/dashboard/*`). A minimal interim improvement (FE-only)
would be a slim view-only dashboard config whose stat cards read
`/user/contracts/stats` — deferred as a follow-up.

## Follow-ups
1. Dashboard: BE `/user` dashboard endpoints, or a slim view-only stat-card dashboard on `/user/contracts/stats`.
2. #106 MSA read-tabs (Rate Sheets / Clause Library / Action Log / Vendor Key Personnel) for view-only (from the earlier batch).
