---
id: 260525-bbm
slug: send-approval-dialog-wiring
date: 2026-05-25
status: in-progress
---

# Quick Task 260525-bbm: Wire up SendApprovalDialog

## Problem

[SendApprovalDialog.tsx](src/pages/ContractManagementPage/components/SendApprovalDialog.tsx) is an 86-line mockup. Renders 3 hardcoded `Elise Johnson / Mike@acme.com` rows by default with no connection to the real approver pool, and the `Assigned Approvers` `TextMultiSelect` is a disconnected widget with empty options. Three concrete issues:

1. The approver-row list shows by default; should be hidden until the user picks a group from `Select Approvers Group`.
2. Dark mode is broken — every text/border class is `text-slate-{500-900}` / `border-slate-200` with no `dark:` variant.
3. `Assigned Approvers` is unwired — it should reflect which rows the user has clicked "Assign" on.

## API endpoints (verified)

- `GET /contract/manager/contracts/{contractId}/approvers` → `{data: ApproveUser[]}` where each approver has `approverId`, `name`, `email`, `role`, `approvalLevels: number[]`. This is the pool the dialog selects from (same as the amendment AssignApprovalDialog uses).
- `POST /contract/manager/contracts/{contractId}/claims/{claimId}/approvers` with `{userIds: string[]}` → `contractManagerApi.sendClaimToApprovers`.
- Changes have a list endpoint at `/changes/{changeId}/approvers` but no POST equivalent in the manager API today; the dialog will fall back to a no-op if no `assignUrl` is provided.

## Decisions

### Props (new contract)

```ts
type Props = {
  trigger: React.ReactNode;
  contractId: string;
  entityId: string;        // claim or change id
  entityLabel?: string;    // "claim" | "change", default "claim" (drives toast copy)
  assignUrl?: string;      // POST endpoint; if omitted, submit is a no-op
  onSent?: () => void;     // post-success callback (e.g. query invalidation)
};
```

Caller (ChangeDetailsSheet) computes `assignUrl` as `${roleBasePath}/${changeId}/approvers` for the claim manager case; leaves `assignUrl` undefined on the change non-manager case (preserves existing placeholder behavior).

### State

- `selectedGroup: string` (level number serialized as string; matches AssignApprovalDialog precedent).
- `selectedIds: string[]` — approverIds the user has assigned. Toggled by clicking the per-row Assign button.

### UI gating

- Group selector always visible.
- Approver rows render **only** when `selectedGroup` is set. Filtered to approvers whose `approvalLevels.includes(Number(selectedGroup))`.
- Empty state inside the table when group is set but no approvers match.
- Empty state outside the table when no group is selected ("Select a group to see approvers").
- Per-row Assign button toggles `selectedIds` membership. Active state shows green check / "Assigned"; inactive shows neutral "Assign".
- Assigned Approvers section renders chip-style names of `selectedIds` (derived from the pool by `approverId`). Empty placeholder if none.

### Dark mode

Add `dark:` variants to every:
- `border-slate-200` → `dark:border-slate-700`
- `text-slate-600` → `dark:text-slate-300`
- `text-blue-600` → `dark:text-blue-400`
- `text-green-600` → `dark:text-green-400`
- light hex backgrounds → matched slate-900/800 variants per memory `project_secondary_button_dark_trap`.

### Out of scope

- Refactoring AssignApprovalDialog or extracting a shared base. Both dialogs solve adjacent problems but they invalidate different query keys and have different submit shapes.
- Wiring change non-manager Send for Approval endpoint. No manager `POST /changes/{id}/approvers` route exists today.
- MSA parity: MSAClaimDetailsSheet has no approve UI → no dialog → no edit needed.

## Files to touch

1. **[src/pages/ContractManagementPage/components/SendApprovalDialog.tsx](src/pages/ContractManagementPage/components/SendApprovalDialog.tsx)** — rewrite from placeholder to working dialog.
2. **[src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx](src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx)** — pass new props to the two existing call sites.

## Verification

- `npx tsc -b` exit 0.
- Mental smoke: group dropdown picks Approval Level 1 → only approvers with level 1 show → click Assign → name appears in Assigned chips → Send for Approval POSTs `{userIds: [id]}` to the claim approvers endpoint → invalidate query → dialog closes.
