---
quick_id: 260601-contract-msa-table-actions
date: 2026-06-01
status: complete
---

# Summary: Contract & MSA table row actions + lifecycle dialogs

## What shipped
- **New** `ContractLifecycleDialog.tsx` — shared, generic (kind=`contract`|`msa`)
  confirm→success dialog for `terminate`/`suspend`/`complete`/`manage`. Confirm phase
  (icon + copy + Cancel/confirm) → on success, green-check success state with
  "Go Dashboard" (→ `/dashboard`). Mutates via `postRequest`, invalidates list/stats
  queries by prefix predicate, toasts on error. Dark-mode-safe (navy `#2A4467`,
  red for destructive). Matches the Figma mockups.
- **ContractsTable** kebab: was just "View Details". Now View Contract (all) ·
  Manage (manager & not owner) · Edit (manager & owner, embeds controlled
  `EditContract`) · Complete/Suspend/Terminate (manager & owner, hidden on
  terminated/completed/cancelled). Controlled menu state so dialogs don't fight focus.
- **MsaTable** kebab: same action set with MSA labels. Edit navigates to
  `/dashboard/msa/{id}` (the `CreateMSADialog` edit flow is trigger-based/uncontrolled
  with documented hydration fragility, so embedding it was avoided).
- Added `ownerId` (from `creator._id`) to `ContractRow`/`MsaRow` and populated it in
  both row mappers for owner-gating.

## Verification
- `npx tsc --noEmit` → clean
- `npx eslint` on all 5 touched files → clean
- No unit-test breakage; the `msa.spec.ts` "View Contract" assertion targets the
  Linked Contracts tab (different component), not the MSA list table.

## Provisional / live-test caveat
Per [[feedback_code_only_revalidation_false_negatives]] this is code-verified only.
Confirm on a live screen: menu visibility per role/owner, the 4 dialogs' confirm +
success states, and that the dropdown closes cleanly when a dialog opens.

## BE follow-up (BLOCKED — endpoints 404 today)
1. Implement lifecycle endpoints for both manager routes:
   `POST /contract/manager/contracts/{id}/{terminate|suspend|complete|manage}` and
   `POST /contract/manager/msa-contracts/{id}/{...}`. `manage` = transfer ownership.
   Confirm exact paths/verbs; FE wired optimistically.
2. Include `creator._id` in list payloads (`/manager/contracts`, `.../me`,
   `/manager/msa-contracts`, `.../me`). Without it `isOwner` is always false, so a
   manager sees only "Manage" on their own rows (Edit/Terminate/Suspend/Complete hide).
   A per-row boolean (`isOwner`/`canManage`) would be cleaner than exposing the id.

## Files
- NEW src/pages/ContractManagementPage/components/ContractLifecycleDialog.tsx
- src/pages/ContractManagementPage/components/ContractsTable.tsx
- src/pages/ContractManagementPage/index.tsx
- src/pages/MsaPage/components/MsaTable.tsx
- src/pages/MsaPage/index.tsx
