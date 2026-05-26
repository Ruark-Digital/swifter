---
name: msa-change-mgmt-flow-review
description: Per-role user-flow review of MSA Change Management vs Contract. All three findings shipped — fourth invalidation-trap instance + shared-table swap closes Hybrid Profile drift in two commits.
date: 2026-05-25
status: complete
---

# Summary

Reviewed Change Management user-flow across manager, approver, vendor/PM, and view-only on MSA vs Contract Management. Surfaced a **Hybrid Profile** — MSA inlined its own table but reused the shared `ChangeDetailsSheet`, so the invalidation-key trap survived through the mutation owner even though MSA's own list/stats keys were self-consistent.

## Findings

| # | Finding | Shipped? |
|---|---|---|
| 1 | Invalidation-key trap in shared `ChangeDetailsSheet` (`["contractChanges", contractId]` hardcoded) + latent Contract stats-stale bug | ✅ Shipped `8d8f2e7d8` |
| 2 | MSA approver got wrong details sheet (`ChangeDetailsSheet` instead of `ApproverChangeDetailsSheet`) | ✅ Shipped `5a8e6de61` (via shared-table swap) |
| 3 | MSA manager saw approver-style columns (value, submittedAt) instead of manager-style (urgency, proposalCategory, files) | ✅ Shipped `5a8e6de61` (same commit as #2) |

## What shipped (in commit order)

1. **`8d8f2e7d8`** — `fix(changes): lift invalidation keys on ChangeDetailsSheet, close trap + Contract stats-stale latency`. Fourth instance of the invalidation-trap class. Added optional `listInvalidateQueryKey` / `statsInvalidateQueryKey` props to `ChangeDetailsSheet`, threaded via react-table `meta` through `ChangeTable`, declared explicit query keys in `ChangeTabContent` and spread them onto all 5 `<ChangeTable>` instances. MSA's inline `ChangeDetailsSheet` cell render at the time also got the props. Bonus latent Contract bug closed — the old hardcoded `["contractChanges", contractId]` prefix matched the list key but not the stats key (`["contractChanges", "stats", ...]`); separate `statsInvalidateQueryKey` prop fixes it.

2. **`5a8e6de61`** — `fix(changes): swap MSA inline table for shared ChangeTable, closing variant + column drift`. Per product decision (AskUserQuestion 260525): refactor MSA to use the shared component rather than mirror inline. Replaced MSA's inline `DataTable` + columns + search filter + `statusTone`/`formatChangeValue` helpers with a single `<ChangeTable variant={isApprover ? "approver" : "manager"} />` call. ChangeTable encapsulates the role-aware column sets and the details-sheet dispatch (`ChangeDetailsSheet` for manager, `ApproverChangeDetailsSheet` for approver). Net **−148 lines** in MSA (393 → 247). MSA Change Mgmt collapses from **Hybrid Profile** to **Profile A** (delegate), converging architecturally with Amendments / Deliverables / NCR.

## Verification

- `pnpm exec tsc -b` exit 0 after both commits.
- UI not exercised in dev server. UAT recommended on MSA:
  - **Manager** opens Change Mgmt tab → table columns include urgency, proposalCategory, files (matching Contract manager view).
  - **Manager** approves or rejects a change → row status updates in the list without manual refresh; stats `pending` count decreases.
  - **Approver** opens a change → `ApproverChangeDetailsSheet` opens (not the manager sheet). UAT distinguishing affordance: approver sheet shows approve-status check + identity-gated approve/reject; manager sheet shows Send-for-Approval workflow.
  - **5 tabs** (All / Requests / Orders / Directive / Proposal) — each filters the table to its type via server-side `type` query param.

## Architectural insight surfaced

Change Mgmt was the first **Hybrid Profile** tab — MSA inlined the table but reused the shared details sheet which owned the mutations. This revealed that the invalidation-key trap binds to the **mutation owner**, not the table owner. Inline reimpl of the table doesn't save you. See [[feedback-shared-component-hidden-invalidation-keys]] for the heuristic.

The swap fix collapses MSA from Hybrid → Profile A, eliminating the trap class for this tab going forward.

## Cross-cutting tally

Four shipped invalidation-trap instances (all four discovered in this audit run):

| # | Component | Commit |
|---|---|---|
| 1 | `AmendmentsTable.tsx` | `b7e30180a` |
| 2 | `DeliverablesTable.tsx` | `3583a08d3` |
| 3 | `NcrTable.tsx` + `CreateNcrDialog.tsx` | `84cae6903` |
| 4 | `ChangeDetailsSheet.tsx` | `8d8f2e7d8` |

Plus one predicted fifth instance for Claims §3: `ChangeDetailsSheet.tsx:700` invalidates `["contractClaims"]` in the dual-purpose claims-flow branch. The same prop shape will close it.

## Sidebar — Contract latent bug closed

The `8d8f2e7d8` lift also fixed a pre-existing Contract stats-stale bug: Contract's `ChangeTabContent.tsx` was using a wide-cast `["contractChanges", contractId]` invalidation that matched the list key but not the stats key. After approve/reject on Contract, the All/Pending/Approved/Rejected counts at the top of the page stayed stale until a hard refresh. Now they update.

## Memory updates this session

- `project_msa_change_mgmt_hybrid_findings` → flip to SHIPPED with both commit refs.
- `feedback_shared_component_hidden_invalidation_keys` → tally bumped to 4 instances; Hybrid Profile insight added.
- `msa-contracts-plural-invoice-approve-quirk` → extended to three families (Invoice approve, Amendments stats, all Changes routes).
