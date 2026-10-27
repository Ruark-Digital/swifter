---
name: msa-amendment-flow-review
description: Per-role user-flow review of MSA Amendments vs Contract Management; root-cause invalidation bug shipped in commit b7e30180a. Three secondary findings still open.
date: 2026-05-25
status: complete
---

# Summary

Reviewed Amendments user-flow across manager, approver, vendor/PM, and view-only on MSA vs Contract Management (Contract = source of truth). Unlike Compliance, Amendments delegates to the shared `AmendmentsTable` — so architecture was at parity by construction. Audit instead surfaced a root-cause invalidation bug inside the shared component that broke every MSA mutation flow.

## Findings

| # | Finding | Roles affected | Shipped? |
|---|---|---|---|
| 1 | Shared `AmendmentsTable` hardcodes Contract query-key prefixes in 3 internal invalidation sites — every MSA mutation succeeds BE-side but list stays stale | All 3 mutation flows (vendor, approver, manager) on MSA | ✅ Shipped `b7e30180a` |
| 2 | MSA manager stats endpoint exists but isn't wired; client-derived counts from list | Manager (MSA) | Open |
| 3 | `AssignApprovalDialog` approver-pool fetch hardcodes Contract path regardless of contract type | Manager (MSA) | Open — likely benign; needs BE check |
| 4 | `Edit Submission` button on rejected "Other Combination" amendments has no `onClick` (shared component — affects BOTH Contract and MSA) | Vendor / PM (both pages) | Open |

## Fix shipped

Mirrored `CreateAmendmentDialog`'s `listInvalidateQueryKey` / `statsInvalidateQueryKey` prop shape (memory `project_shared_dialog_contract_msa_reuse_pattern`) on `AmendmentsTable`, `AmendmentDetailsSheet`, and `AssignApprovalDialog`. Defaults to current bare Contract keys so Contract behavior is unchanged. Both Contract `AmendmentsTabContent.tsx` and MSA `Amendments.tsx` now pass their actual query keys explicitly.

## Verification

- `pnpm exec tsc -b` exit 0 — no type errors.
- UI not exercised in dev server. Manual UAT recommended on MSA:
  - Vendor accepts an amendment → list refreshes, row vendorStatus changes from Pending to Accepted without a manual refresh.
  - Approver approves a time-impact amendment → list refreshes, status flips.
  - Manager clicks Assign Approval and selects approvers → list refreshes; the Assign Approval button disappears (gate is `!assignApprover && !hasApprovals && isTimeImpact && vendorAccepted`).

## Commit

- `b7e30180a` — `fix(amendments): lift invalidation keys to props so MSA mutations refetch list`

## Memory updates from this session

- Updated `msa-contracts-plural-invoice-approve-quirk` — second known plural instance (`/manager/msa-contracts/{id}/amendments/stats`).
- New `project_msa_amendments_shared_table_invalidation` — finding-level capture; now shipped.
- New `feedback_shared_component_hidden_invalidation_keys` — generalized heuristic: grep shared components' internal `queryClient.invalidateQueries` for Contract-keyed assumptions.
