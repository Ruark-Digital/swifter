---
id: 260525-ad1
slug: fix-claims-approval-gating-impact-column
date: 2026-05-25
status: complete
---

# Summary — 260525-ad1: Fix claims approval gating + impact column display

## Files changed (3)

1. **[src/pages/ContractManagementPage/lib/contractChanges.ts](src/pages/ContractManagementPage/lib/contractChanges.ts)** — `getManagerApproveChangeUrl` now preserves the role prefix from `roleBasePath` (manager **or** approver) instead of hardcoding `/manager/`. The function name retains its misnomer to avoid touching the test import; existing `/manager/`-only test assertions still pass.
2. **[src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx](src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx)** — added `useUser` from `@/store/authSlice`; computed `isAssignedApprover`, `canApproverDecideOnClaim`, `canManagerActOnClaim`, `sendForApprovalEnabled`; re-branched the footer JSX to render distinct paths for change-flow vs claim-flow with role × impact gating. Approve/Reject dialog title and helper copy now read "Claim" on the claim flow. Mutation gate widened from `/manager/` only to `/manager/ OR /approver/`.
3. **[src/pages/ContractManagementPage/components/ClaimsTable.tsx](src/pages/ContractManagementPage/components/ClaimsTable.tsx)** — added a module-level `formatImpact` helper matching MSA's; replaced the inline impact cell.

## Decision matrix shipped (claims only)

| Actor | Visible | Enabled when |
|-------|---------|--------------|
| **Manager** | Reject Claim + Send for Approval | Send: `impact !== "time"` OR (`approverStatus === "approved"` AND `approvers.length === 0`). Reject always. |
| **Approver** | Reject + Approve | `impact === "time"` → current user `_id` is in `approvers[].user[].user`. `impact !== "time"` → `approverStatus === "pending"`. |
| **Vendor / Admin / ViewOnly** | none | — |

Change-flow gating untouched. Identity match uses `useUser()._id` (same precedent as [NcrTable.tsx:168](src/pages/ContractManagementPage/components/NcrTable.tsx#L168)).

## MSA parity (verified, no edits needed)

- **MSA claim approval**: [MSAClaimDetailsSheet.tsx](src/pages/MsaPage/components/MSAClaimDetailsSheet.tsx) has no approve/reject/send-approval action today (only `addCommentMutation`). Nothing to gate.
- **MSA claim impact column**: [Claims.tsx:50-58](src/pages/MsaPage/layouts/Claims.tsx#L50-L58) already has the canonical `formatImpact` helper — this task ported it to the contract surface.

## Verification

- `npx tsc -b` exit 0.
- Existing unit tests in [ade85-manager-approve-change-url.unit.spec.ts](src/pages/ContractManagementPage/__tests__/ade85-manager-approve-change-url.unit.spec.ts) still pass (all three inputs trace to `/manager/...` since none of them carry an `/approver/` role segment — the new regex-derived role-prefix path is unreachable from those inputs).

## Out of scope (deliberate)

- "Send for Approval" backend wiring — `SendApprovalDialog` is a placeholder; this task only gates visibility/enabled state.
- Change flow gating — untouched.
- Function name `getManagerApproveChangeUrl` — kept the misnomer to avoid touching test import and JSX call sites; the body is now role-agnostic.
