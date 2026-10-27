---
name: msa-ncr-flow-review
description: Per-role user-flow review of MSA NCR Log vs Contract Management; invalidation-key lift shipped in commit 84cae6903. Third instance of the trap class.
date: 2026-05-25
status: complete
---

# Summary

Reviewed NCR Log user-flow across manager, approver, vendor/PM, and view-only on MSA vs Contract Management. Like Amendments and Deliverables, MSA delegates to the shared `NcrTable` (since Wave 5 of the 260524 audit). The review surfaced the same invalidation-key trap pattern — third known instance.

## Findings

| # | Finding | Roles affected | Shipped? |
|---|---|---|---|
| 1 | Shared NcrTable / CreateNcrDialog hardcode `["contractNcrs", ...]` invalidation keys in 4 mutation sites; MSA list/stats stay stale after Create NCR, Approve CAPA, Close NCR | All 3 mutating roles (vendor, approver, NCR submitter) on MSA | ✅ Shipped `84cae6903` |

## What shipped

**Invalidation-key lift** — direct port of `b7e30180a` (Amendments) and `3583a08d3` (Deliverables). Added optional `listInvalidateQueryKey` / `statsInvalidateQueryKey` props to:
- `NcrTable` (outer, threaded via react-table `meta` to reach the actions-column cell)
- `NcrDetailsSheet` (mutations live here — `approveCapaMutation` + `closeNcrMutation`)
- `CreateNcrDialog`

`NcrDetailsSheet`'s `invalidateNcrQueries` falls back to the original wide-cast `["contractNcrs"]` when no props are provided, preserving Contract's prior behavior. Both parents now pass explicit query keys.

`CreateNcrDialog` gains a stats invalidation (previously only invalidated `["contractNcrs", contractId]` which matched the list prefix but not the stats key) — strict improvement for both Contract and MSA.

`SubmitCapaDialog` deliberately untouched — its only invalidation is the detail key which works on both pages via the shared `NcrDetailsSheet`'s `useUserQueryKey` wrapping. CAPA submission doesn't change the row's NCR status so list/stats don't need to refresh on submit.

## Verification

- `pnpm exec tsc -b` exit 0.
- UI not exercised. UAT pass recommended on MSA:
  - Vendor/PM/Approver creates an NCR → new row appears in list immediately, stats `total` increments.
  - Responder submits CAPA → "Approve CAPA" button appears for the submitter in their next sheet open (detail refreshes; list deliberately doesn't change because row status is still pending).
  - Submitter approves CAPA → list row flips to "Approved" without manual refresh.
  - Submitter completes Close NCR checklist → list row flips to "Closed" without manual refresh.

## Commit

- `84cae6903` — `fix(ncr): lift invalidation keys to props so MSA mutations refetch list/stats`

## Memory updates this session

- `project_msa_ncr_shared_table_invalidation` — finding-level capture (will be updated to reflect SHIPPED status).
- `feedback_shared_component_hidden_invalidation_keys` — tally updated to 3 known instances, plus a new sub-pattern: the wide-cast position-0 prefix variant introduced by NCR.

## Cross-cutting recap

Three known instances of the invalidation-key trap, all now shipped:

| # | Component | Commit |
|---|---|---|
| 1 | `AmendmentsTable.tsx` (3 sites) | `b7e30180a` |
| 2 | `DeliverablesTable.tsx` (2 sites) | `3583a08d3` |
| 3 | `NcrTable.tsx` + `CreateNcrDialog.tsx` (4 sites, plus a wide-cast variant) | `84cae6903` |

Pattern is established. Future reviews of Group A's remaining tabs (RFI, Change Mgmt, Claims) should expect to find the same trap and apply the same lift.
