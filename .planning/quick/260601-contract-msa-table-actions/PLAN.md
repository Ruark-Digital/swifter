---
quick_id: 260601-contract-msa-table-actions
date: 2026-06-01
status: in-progress
---

# Quick Task: Contract & MSA table row actions + lifecycle dialogs

## Goal
Add the full kebab action set to the Contract table and MSA table, plus the
confirm→success dialogs they trigger (Figma-driven).

Actions: View · Manage · Edit · Terminate · Suspend · Complete.
Dialogs (confirm + success state): Terminate, Suspend, Complete, Manage.

## Decisions (user, 2026-06-01)
1. **Backend**: lifecycle endpoints don't exist in swagger → optimistic wiring.
   `POST /contract/manager/{contracts|msa-contracts}/{id}/{terminate|suspend|complete|manage}`.
   Flag as BE follow-up.
2. **Action set**: all 6; Complete gets a matching confirm dialog (no mockup drawn).
3. **Gating**:
   - View → everyone
   - Edit / Terminate / Suspend / Complete → `isManager` AND owner (current user === creator)
   - Manage → `isManager` AND **not** owner (transfer ownership to you)
   - Status-aware: hide Terminate/Suspend/Complete on terminated/completed (also cancelled) rows
   - Both Contract and MSA tables

## Approach
- NEW `ContractLifecycleDialog.tsx` — shared, generic (kind=contract|msa), 4 actions,
  confirm phase + success phase ("Go Dashboard" → /dashboard), useMutation→postRequest,
  prefix-predicate query invalidation, dark-mode-safe styling (navy #2A4467 / red).
- Convert each table's `actions` cell to a hook-using component:
  - Contract: embed controlled `EditContract` (open/onOpenChange/contractId) for Edit.
  - MSA: `CreateMSADialog` is trigger-based/uncontrolled + fragile edit hydration →
    Edit navigates to `/dashboard/msa/{id}` (canonical edit lives there). Documented asymmetry.
- Add `ownerId` (from `creator._id`) to ContractRow + MsaRow; populate in the two row mappers.

## Files
1. NEW src/pages/ContractManagementPage/components/ContractLifecycleDialog.tsx
2. EDIT src/pages/ContractManagementPage/components/ContractsTable.tsx (ownerId + actions cell)
3. EDIT src/pages/ContractManagementPage/index.tsx (populate ownerId)
4. EDIT src/pages/MsaPage/components/MsaTable.tsx (ownerId + actions cell)
5. EDIT src/pages/MsaPage/index.tsx (populate ownerId)

## Verify
- `npx tsc --noEmit` clean
- `npx eslint` clean on touched files

## BE follow-up (blocked)
- Implement lifecycle endpoints (terminate/suspend/complete + manage/transfer-ownership)
  for both Contract and MSA manager routes.
- Include `creator._id` in list payloads (`/manager/contracts`, `/manager/contracts/me`,
  `/manager/msa-contracts`, `.../me`) so owner-gating resolves — without it, managers see
  only "Manage" on their own rows. A boolean `isOwner`/`canManage` per row would be cleaner.
