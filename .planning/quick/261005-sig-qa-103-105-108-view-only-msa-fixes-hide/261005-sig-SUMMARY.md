---
quick_id: 261005-sig
slug: qa-103-105-108-view-only-msa-fixes-hide
date: 2026-10-05
status: complete
commit: cd0c45c35
---

# Summary — View-only batch (#102–108): MSA-side fixes shipped

Scoped the `/user/*`-unblocked view-only batch against docs.json coverage, then
shipped the clean, verifiable MSA-side fixes. Contracts-side (#102) is a larger
feature; #104 and part of #106 are BE-blocked.

## Shipped ✅ (commit cd0c45c35)

- **#108** — MSA "view only" tab whitelist listed `approvers`, but there is no
  view-only approvers endpoint, so opening the tab red-flagged. Removed it.
- **#105** — view-only users couldn't see an MSA's linked contracts: the fetch
  was gated to manager/company_admin and hardcoded to `/contract/manager/...`.
  Now enabled for view-only against `/contract/user/msa-contracts/{id}/linked-contract`.
- **#103 (MSA side)** — view-only don't own MSAs, so the "My MSA" tab (backed by a
  `.../me` endpoint they can't call) is hidden; they see only "All MSA", matching
  the company-admin view.
- Refactor: extracted the per-role tab whitelist to `src/pages/MsaPage/msaTabWhitelist.ts`
  so it's unit-testable without importing the page (which pulls react-pdf/pdfjs,
  unavailable under jsdom). Test: `view-only-msa-tabs.unit.spec.ts`.
- **#106 (read tabs)** — added Rate Sheets, Vendor Key Personnel, Action Log and
  Clause Library to the view-only MSA whitelist and pointed each tab-content at the
  `/user/msa-contracts/{id}/…` base path (commit 8cf2dfa2a):
  - Rate Sheets: `RateSheetsTabContent` already resolved the view-only `/user` path.
  - Vendor Key Personnel: GET now `/contract/user/...`; edits stay gated behind
    `canManage` (manager/CM + owner) → read-only for view-only.
  - Clause Library: read via `/user`; Export button hidden for view-only (no
    `/user/.../clauses/export` endpoint — only manager/approver have it).
  - Action Log (MSA): list reads `/contract/user/msa-contracts/{id}/logs`; export
    is client-side.
  - Analytics / KPI / Compliance / Payment Summary still omitted (BE-blocked).

Verification: vitest 2/2 ✓ · `tsc -b` exit 0 (Vercel gate) ✓ · eslint on changed
lines clean (one PRE-EXISTING `formatMoney` exhaustive-deps warning in
MsaDetailPage left untouched — surgical-changes rule; it is on the base branch).

## Scope map (docs.json `/user/*` coverage)

| Item | FE-actionable? | Status |
|------|----------------|--------|
| #103 (My MSA) | yes | ✅ shipped |
| #105 (MSA linked contracts) | yes — `/user/msa-contracts/{id}/linked-contract` | ✅ shipped |
| #108 (approvers red flag) | yes | ✅ shipped |
| #102 (view-only contracts + dashboard) | yes but **feature-sized** | ⏭ deferred |
| #103 (My Contracts) | tied to #102 | ⏭ deferred |
| #106 (MSA tabs: Rate Sheets / Clause Library / Action Log / Vendor Key Personnel) | yes — endpoints exist | ✅ shipped (8cf2dfa2a) |
| #106 (MSA tabs: Analytics / KPI / Compliance / Payment Summary) | no | ⛔ BE-blocked (no `/user/msa-contracts/{id}/analytics|kpi|compliance|payment-summary`) |
| #104 (Projects + Business Division) | no | ⛔ BE-blocked (no `/user/projects`, `/user/business-division`) |
| #107 (MSA Export report) | separate, all-profiles | ⏭ out of scope (export endpoint hardcoded to /manager) |

### #102 note (deferred — feature)
`isContractVendorLike = isVendor || isProjectManager` excludes view-only, so on the
contracts page view-only falls through to the manager-style layout (manager queries
that 403 → no contracts, plus a "My Contracts" tab). Fixing it means giving
view-only its own contracts layout wired to `/user/contracts` + `/user/contracts/stats`
(both exist). Bounded but larger than this PR.

## Follow-ups
1. #102 + #103-contracts: view-only contracts layout on `/user/contracts`.
2. #106 read tabs (Rate Sheets / Clause Library / Action Log / Vendor Key Personnel):
   add to the view-only whitelist once each tab-content resolves the `/user` msa base path.
3. BE: `/user/msa-contracts/{id}/{analytics,kpi,compliance,payment-summary}` and
   `/user/projects`, `/user/business-division` for #106 (rest) and #104.
