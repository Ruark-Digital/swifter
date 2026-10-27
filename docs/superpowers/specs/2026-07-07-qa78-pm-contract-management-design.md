# QA #78 — Vendor PM Contract Management + Approval-Gated Take-Over

**Date:** 2026-07-07
**Status:** Design approved, pending spec review
**Scope (this spec):** Regular (non-MSA) contracts, Vendor PM role. MSA is an identical follow-up pass.

## Background

Client (Osofowora Oladipupo) clarified QA #78 on 2026-07-05:

1. *"the PM to be able to see all contracts assigned/awarded to a vendor.....Yes, they should"*
2. *"lets allow them to take over/Manage other PMs contracts.....similar to how it is for PLs and CMs"*
3. *"this is only if there are multiple PMs for a single vendor"*
4. *"...The CM/PL or Company Admin should still be able to assign a new PM to an existing contract"*
5. *"Is it possible to get approval from PL/CM before they take over.....so that the company can maintain control"*

Correction from the product owner: **the PM assigns themselves** (self-service take-over), and the
take-over **must be approved by a PL/CM** before it takes effect, so the company retains control.

## Backend (docs.json v2.3.0, 600 paths — flow shipped 2026-07-05)

The full request→approve workflow is now backed:

| Step | Endpoint | Notes |
|------|----------|-------|
| PM self-assign / take-over | `POST /vendor/contracts/{contractId}/project-managers/{projectManagerId}/assign` | No body. `projectManagerId` = the requesting PM. Creates a **pending** assignment. |
| Pending state (read) | `GET` contract detail → `ContractServiceDetail.projectManager = { user:{_id,name}, status, actionedAt }` | `status` = pending/approved/rejected. |
| CM/PL approve or reject | `POST /manager/contracts/{contractId}/project-manager/approval` | Body `{ action: "approved" \| "rejected", reason? }`. `reason` **required** when rejected. Keyed by contractId → one pending assignment per contract. |
| Unassign | `DELETE /vendor/contracts/{contractId}/project-managers` | Removes the assigned PM. |
| Assign picker source | `GET /vendor/contracts/{contractId}/personnel` → `ApiResponseUserList` | Items are `UserBasic{_id,name,email}` (no role field — assume BE scopes to eligible PMs; verify live). |

**Known non-blocking gap:** list items (`VendorContractServiceListItem`) expose `projectManager.{name}` +
`owner: boolean` but **no `status`**, so a per-row "Pending" badge on the tab list is not backable yet. The
pending state is shown on the contract detail page. Optional BE nice-to-have: add `projectManager.status`
to the list item.

Discovery path for CM/PL: there is no dedicated "list pending PM requests" endpoint. CM/PL are notified via
the dashboard **general-updates feed** (BE-emitted) and click into the contract detail to act — consistent
with how deliverable/invoice/amendment approvals already surface.

## Design

### A. All / My Contracts tabs — `src/pages/ContractManagementPage/index.tsx`

Currently a Vendor PM (`isProjectManager`) sees a single `VendorContractsTable` fed from
`/vendor/contracts/me`. Replace that, for the PM, with the CM's existing two-tab layout:

- **All Contracts** tab → `useVendorContracts(asPM=false)` → `/vendor/contracts` (company-wide).
- **My Contracts** tab → `useVendorContracts(asPM=true)` → `/vendor/contracts/me` (today's behavior).
- Each tab has its own `PaginationState`.
- Plain `isVendor` (non-PM company account) is unchanged (single all-contracts table).

Add `owner?: boolean` to `VendorContractApi`; map it to a new `isOwner` on `VendorContractRow`
(`mapVendorContractsToRows` currently drops it).

### B. Take-over action — `src/pages/ContractManagementPage/components/VendorContractsTable.tsx`

- Add `isOwner` to `VendorContractRow`; add an `enableTakeOver?: boolean` prop (true only on the All tab).
- On the All tab, rows where `owner === false` get a **"Request take-over"** action in the row menu.
  Owner rows do not (they already own it). This implicitly honors requirement #3 ("only if multiple PMs"):
  a solo PM owns all their assigned contracts, so there are no non-owned rows to take over.
- Action → `POST /vendor/contracts/{contractId}/project-managers/{projectManagerId}/assign`, where
  `projectManagerId` is the **current PM's own user id** from `useUser()._id` (self take-over). On success:
  toast ("Take-over request sent for approval") and invalidate the `vendor-contracts` / `pm-contracts`
  query keys. **Verify live** that self-assigning with one's own id routes into the pending-approval path
  (rather than an immediate assign) before relying on it.
- **Actions cell refactor:** extract the row menu into its own `VendorContractActionsCell` component that
  owns its dialog/confirm state locally and reads single-open-menu state from a **React Context** (not a
  parent-lifted `openMenuRowId` in a `useMemo` dep). This avoids the remount-wipes-dialog-state trap fixed
  previously in commit `f5ac77c96` (see `project_edit_contract_dialog_not_opening_260703`).

### C. CM/PL approve/reject — contract detail page

- On the contract detail (the CM/PL owner view), where `projectManager.status` indicates a pending
  request, render a **"Take-over request from {name}"** banner/section with **Approve** and **Reject**.
- **Approve** → `POST /manager/contracts/{contractId}/project-manager/approval` `{ action: "approved" }`.
- **Reject** → opens a reason dialog (reason required) → same endpoint `{ action: "rejected", reason }`.
- Gated to CM/PL (owner). Mirrors the existing deliverable/invoice/amendment inline approve/reject pattern
  and reuses the shared `ConfirmAlert` / approve-reject-comment dialog pattern.
- On success: toast + invalidate the contract detail query.

### Data flow

```
PM (All tab) --Request take-over--> POST assign --> pending
   ↓ (BE emits general-update)
CM/PL dashboard feed --> contract detail (projectManager.status = pending)
   --Approve/Reject--> POST approval --> PM assigned / request rejected(+reason)
```

## Increments

1. **Increment 1 — tabs + view (no approval):** All / My tabs, `owner` gating, All tab view-only.
   Zero risk, immediate value (requirement #1).
2. **Increment 2 — take-over + approval:** Request-take-over action (B) + CM/PL approve/reject (C).

Both are backable now; they are split so Increment 1 can ship independently if Increment 2 needs iteration.

## Out of scope

- MSA contracts (identical follow-up pass; endpoints already exist).
- Requirement #4 (CM/PL/Company-Admin directly assigning an arbitrary PM): the shipped approval endpoint
  covers approving a PM's self-request. A manager-initiated *assign* (choose any PM, no PM request first)
  has no dedicated endpoint and is deferred pending product confirmation that it's still needed separately.
- Per-row "Pending" badge on the tab list (needs `projectManager.status` on the list DTO).

## Testing

Playwright, following the existing `src/pages/ContractManagementPage/__tests__` patterns:

- PM sees both tabs; All tab lists company-wide contracts, My tab lists assigned ones.
- Non-owner row on All tab shows "Request take-over"; owner row does not.
- Requesting take-over fires the assign POST and shows the confirmation toast.
- On contract detail as CM/PL, a pending request shows Approve/Reject; Reject requires a reason;
  both hit the approval endpoint with the correct body.
