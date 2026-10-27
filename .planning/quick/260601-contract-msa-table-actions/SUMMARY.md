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
  Manage (manager & not owner) · Edit (manager & owner) · Complete/Suspend/Terminate
  (manager & owner). Controlled menu state so dialogs don't fight focus.
- **Per-status matrix** (260601 refinement, centralized in `contractLifecycle.ts`):
  - Edit → `draft` only
  - Terminate + Suspend → `pending_approval` / `active` / `publish`
  - Complete → `active` / `publish`
  - ended states (terminated/completed/cancelled/expired) → no lifecycle actions
  - Manage → owner-based only (status-independent)
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

## Owner detection (RESOLVED 2026-06-01)
Contract list payload already returns a per-row `owner: boolean` (+ `creator._id`).
FE now consumes `row.isOwner` (from BE `owner`); id-matching kept only as a fallback
for payloads without it (MSA list may lack `owner`). Verified vs live response:
"We create" (draft, owner:true) → Edit shows; "atavus tabesco contur" (draft,
owner:false) → Edit hidden + Manage shown (correct, per the owner rule).

## Endpoints (RESOLVED 2026-06-01 — BE shipped, FE wired to real paths)
- terminate / suspend / complete → `PATCH /manager/{contracts|msa-contracts}/{id}/status`
  body `{ status: "terminated" | "suspended" | "completed" }` (action verb → status value).
- manage → `POST /manager/{contracts|msa-contracts}/{id}/manage` (no body; adds current
  user to managers list; returns added / already-manager / creator message).
- Both wired in ContractLifecycleDialog via patchRequest/postRequest. No more optimistic 404s.

## BE follow-up
1. (Optional) Add the same `owner: boolean` to the MSA list payload so MSA
   owner-gating doesn't depend on the creator._id fallback.

## Files
- NEW src/pages/ContractManagementPage/components/ContractLifecycleDialog.tsx
- src/pages/ContractManagementPage/components/ContractsTable.tsx
- src/pages/ContractManagementPage/index.tsx
- src/pages/MsaPage/components/MsaTable.tsx
- src/pages/MsaPage/index.tsx
