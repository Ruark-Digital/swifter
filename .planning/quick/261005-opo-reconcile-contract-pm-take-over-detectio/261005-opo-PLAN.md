---
quick_id: 261005-opo
slug: reconcile-contract-pm-take-over-detectio
date: 2026-10-05
status: in-progress
---

# Reconcile Contract PM take-over detection to the deployed `pendingProjectManager` shape

## Context

BE deployed the PM-assignment endpoints (QA #78, previously BE-blocked per STATE.md)
and dropped `FE_IMPLEMENTATION_GUIDE_PM_ASSIGNMENT.md`. The vendor assign-by-id
(`POST /vendor/contracts/:id/project-managers/:pmId/assign`) and CM approval
(`POST /manager/contracts/:id/project-manager/approval`) endpoints are already wired
and tested. The guide documents one change in the **response shape**:

- Deployed BE returns the pending take-over in a dedicated `pendingProjectManager`
  object (`{ user, status: "pending", actionedAt }`) and leaves `projectManager`
  **null** until the CM approves.
- The FE currently detects the pending take-over via
  `contractData.projectManager?.status === "pending"`
  ([ContractDetailPage.tsx:306](../../../src/pages/ContractManagementPage/ContractDetailPage.tsx)).

Against the deployed shape the detection never fires, so the CM "Take-over request"
action card would not render. Fix with a dual-read (new `pendingProjectManager`,
legacy `projectManager.status === "pending"` fallback) — the field-drift pattern
STATE.md sanctions.

## Tasks

1. **Add the `pendingProjectManager` type** → `src/types.ts`
   - Add `PendingProjectManager` interface (`user` = populated object **or** bare
     ObjectId string; `status`; `actionedAt`) and an optional
     `pendingProjectManager?` field on `ContractDetail`.
   - verify: `tsc -b` clean.

2. **Extract a pure dual-read helper + wire it in** →
   `src/pages/ContractManagementPage/pmTakeover.ts` (new),
   `src/pages/ContractManagementPage/ContractDetailPage.tsx`
   - `resolvePendingPmTakeover(contract) → { pending, requesterName? }`: pending
     from `pendingProjectManager` (new) else `projectManager.status==="pending"`
     (legacy); requester name resolved from a populated object (nested
     `user.user.name` or `user.name`), `undefined` for a bare ObjectId string.
   - Replace the inline `takeOverPending` / `takeOverRequesterName` derivation
     with the helper. Leave the approval payload (`{action, reason}`) and the
     PM-accepts-contract flow untouched.
   - verify: card render + approve/reject logic unchanged for the legacy shape.

3. **Tests** → `pmTakeover.unit.spec.ts` (new, vitest),
   `qa78-takeover-approval.spec.ts` (extend, playwright)
   - Unit: new shape, legacy shape, bare-ObjectId name fallback, nested populated
     name, neither → not pending.
   - E2e: add a scenario seeding `pendingProjectManager` (with `projectManager: null`)
     mirroring the existing legacy scenario.
   - verify: `npx vitest run src/pages/ContractManagementPage/__tests__/pmTakeover.unit.spec.ts` green; `tsc -b` clean.

## Success criteria

- `tsc -b` passes (Vercel's build gate).
- New vitest unit spec passes.
- Legacy take-over Playwright scenario still structurally valid; new-shape scenario added.
- CM action card detection works against both the deployed and legacy response shapes.

## Out of scope

- 115 / 116 / 135 and the "user route api" triage items (no in-repo mapping yet; deferred per user).
- The PM-accepts-contract (`pending_approval`) flow — distinct from take-over.
