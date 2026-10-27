---
id: 260525-bbm
slug: send-approval-dialog-wiring
date: 2026-05-25
status: complete
---

# Summary — 260525-bbm: Wire up SendApprovalDialog

## Files changed (2)

1. **[src/pages/ContractManagementPage/components/SendApprovalDialog.tsx](src/pages/ContractManagementPage/components/SendApprovalDialog.tsx)** — full rewrite from 86-line mock to a working dialog. New props (`contractId`, `entityLabel`, `assignUrl`, `onSent`). Fetches the contract approver pool from `/contract/manager/contracts/{contractId}/approvers` (the same endpoint AmendmentsTable's AssignApprovalDialog uses). Group options derived from the union of `approvalLevels` across the pool. Approver rows render only when a group is selected — otherwise a dashed-border placeholder reads "Select a group to see available approvers." Per-row Assign button toggles a controlled `selectedIds` array; "Assigned Approvers" section renders chip-style names derived from those ids with a click-to-remove X. Group dropdown uses shadcn `Select` (not `TextSelect`, which has an awkward union onChange signature for controlled standalone use). Submit POSTs `{userIds: selectedIds}` to `assignUrl` when provided; throws a clear error when called without one (preserves placeholder behavior on the change non-manager call site).
2. **[src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx](src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx)** — both SendApprovalDialog call sites now pass `contractId`, `entityLabel`, and `onSent`. The claim manager call site additionally passes `assignUrl={`/contract/manager/contracts/${contractId}/claims/${changeId}/approvers`}` (verified against [contractManagerApi.ts:1121](src/pages/ContractManagementPage/api/contractManagerApi.ts#L1121) — `sendClaimToApprovers`) and invalidates both the change-detail query and `["contractClaims"]` on success.

## What shipped vs the three asks

| Ask | Behavior |
|-----|----------|
| Approvers list should not show until a group is picked | Dashed placeholder card before group selection; filtered list (`approvalLevels.includes(Number(selectedGroup))`) after. |
| Dark mode broken | Every `border-slate-*` / `text-slate-*` / hex class has a paired `dark:*` variant. DialogContent surface, group select trigger, list container, divider, role text, action button, chip row, Back button — all visible in dark mode. |
| Assigned Approvers should reflect Assign clicks | `selectedIds` is the single source of truth. Assign button toggles membership; chip row maps each id back to the pool entry; chip X removes. Send button label includes the count: `Send for Approval (2)`. Disabled when count is 0 or no `assignUrl`. |

## MSA parity verified, no edits needed

[MSAClaimDetailsSheet.tsx](src/pages/MsaPage/components/MSAClaimDetailsSheet.tsx) has no approve / reject / send-approval UI today (only `addCommentMutation`). The dialog is not consumed from the MSA surface anywhere, so the rewrite covers MSA implicitly.

## Verification

- `npx tsc -b` exit 0.
- Pool fetch is gated on `open && Boolean(contractId)` so the dialog doesn't hammer the API while closed.
- Dialog state (`selectedGroup`, `selectedIds`) resets on close so a re-open starts fresh — no stale checkbox carryover.

## Out of scope

- AssignApprovalDialog refactor / extraction to a shared base. The amendment dialog invalidates `contract-amendments` / `contract-amendments-stats` and has its own search box; keeping them separate beats a premature shared abstraction.
- Change non-manager Send-for-Approval endpoint. No manager `POST /changes/{id}/approvers` route exists today; that call site passes no `assignUrl` and the submit gracefully no-ops with an explicit toast.

## Memory

The pattern of group-gated approver selection + Assign-toggle + chip-row recap is now used twice in this codebase (AmendmentsTable AssignApprovalDialog and now this dialog). If it shows up a third time, consider extracting. Cross-link in `project_approve_reject_comment_dialog_pattern.md` follow-ups.
