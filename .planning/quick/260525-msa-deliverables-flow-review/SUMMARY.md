---
name: msa-deliverables-flow-review
description: Per-role user-flow review of MSA Deliverables vs Contract Management; invalidation-key lift + stats-card trim shipped in commit 3583a08d3. Personnel-pool fix deferred pending BE check.
date: 2026-05-25
status: complete
---

# Summary

Reviewed Deliverables user-flow across manager, approver, vendor/PM, and view-only on MSA vs Contract Management. Like Amendments, MSA delegates to the shared `DeliverablesTable` — so action gates were at parity by construction. The audit surfaced two structural bugs inside the shared component plus a cosmetic stats-card drift.

## Findings

| # | Finding | Roles affected | Shipped? |
|---|---|---|---|
| 1 | Shared `DeliverablesTable` hardcodes Contract query-key prefixes in 2 internal invalidation sites — vendor Submit + approver/manager Approve/Reject succeed BE-side but MSA list/stats stay stale | All 3 mutating roles (vendor, approver, manager) on MSA | ✅ Shipped `3583a08d3` |
| 2 | `SubmitDeliverableDialog` personnel fetch via `vendorApi.listPersonnel` is hardcoded to Contract path; MSA vendor's responders dropdown likely empty | Vendor / PM (MSA) | Deferred — needs BE check first (user explicitly ignored on 260525) |
| 3 | MSA stats card count diverges (7 cards) from Contract (4) via inline `StatCard` | All who see the tab on MSA | ✅ Shipped `3583a08d3` — trimmed MSA to match Contract via shared `DeliverablesStatsCards` |

## What shipped

**Invalidation-key lift** — direct port of `b7e30180a` (Amendments). Added optional `listInvalidateQueryKey` / `statsInvalidateQueryKey` props to `SubmitDeliverableDialog`, `DeliverableDetailsSheet`, and `DeliverablesTable`. Threaded through the react-table `meta` so the actions-column cell can reach them. Defaults preserve the bare Contract keys. Both Contract `DeliverablesTabContent` and MSA `Deliverables.tsx` now pass their actual query keys explicitly.

**Stats card trim** — replaced MSA's inline 7-card `StatCard` grid with the shared `DeliverablesStatsCards` (4 cards: All / Submitted / Pending / Late). Dropped the inline `StatCard`, `toneClasses`, `Card`/`CardContent`/`FileText` imports, and the 3 extra fields on the local `DeliverablesStatsData` type. Per the user's "Contract is expected" principle (user selected "Trim MSA to 4" via AskUserQuestion).

## What was deferred

**Personnel pool hardcoded path** — user said "ignore" on this finding pending a one-shot BE check to confirm the correct MSA personnel URL. Memory `project_msa_deliverables_shared_table_invalidation` retains the finding so it surfaces in future work.

## Verification

- `pnpm exec tsc -b` exit 0 — no type errors.
- UI not exercised in dev server. UAT recommended on MSA:
  - Vendor submits a deliverable → list refreshes, row submission status flips from Pending to Submitted without manual refresh.
  - Approver / Manager approves or rejects a pending deliverable → list refreshes, status flips.
  - Stats grid renders 4 cards (All / Submitted / Pending / Late), matching Contract.

## Commit

- `3583a08d3` — `fix(deliverables): lift invalidation keys + trim MSA stats to match Contract`

## Memory updates this session

- `project_msa_deliverables_shared_table_invalidation` — new (will be updated to reflect SHIPPED status).
- `feedback_shared_component_hidden_invalidation_keys` — tally updated to track 2 invalidation instances and the pool-lookup sub-pattern.
- `MEMORY.md` index updated.
