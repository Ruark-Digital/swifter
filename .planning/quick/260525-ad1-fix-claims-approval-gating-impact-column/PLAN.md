---
id: 260525-ad1
slug: fix-claims-approval-gating-impact-column
date: 2026-05-25
status: in-progress
---

# Quick Task 260525-ad1: Fix claims approval gating + impact column display

## Problem

The Claim Details sheet ([ChangeDetailsSheet.tsx](src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx), which is dual-purpose for changes and claims via `isClaim = roleBasePath.includes("/claim")`) currently:

1. Shows "Send for Approval" to every non-manager role (it's the else-branch of `canApprove ? Approve : SendApprovalDialog`). Should be **manager-only**, and time-impact claims should gate enablement.
2. Has no identity-based gate on approver approve/reject for time-impact claims — any approver-role user sees the buttons even when they're not in the claim's `approvers[]` allowlist.
3. ClaimsTable's Impact column renders raw `row.impact` enum strings (e.g. `"5000000"`, `"45"`) with no unit context — MSA's [Claims.tsx](src/pages/MsaPage/layouts/Claims.tsx) already has a `formatImpact` helper that produces `"$5M + 45 days"` / `"45 days"` / `"$5M"`.

## API contract (verified)

```jsonc
{
  "status": "under review",      // top-level claim status
  "approverStatus": "approved",   // rollup after manager approval
  "impact": "cost",               // "cost" | "time" | "time_cost"
  "cost": 5000000,
  "approvers": [                  // assigned approver list (multi-level)
    {
      "user": [{ "user": "<userId>", "status": "pending", "_id": "..." }],
      "amount": 500000,
      "group": "Director Approval",
      "levelStatus": "pending"
    }
  ]
}
```

## Decisions

### Footer gating (claims only — non-claim/changes path untouched)

| Actor | Visible buttons | Enabled when |
|-------|-----------------|--------------|
| **Manager** | Reject Claim + Send for Approval | Reject: always (if visible). Send: `impact !== "time"` OR (`approverStatus === "approved"` AND `approvers.length === 0`) |
| **Approver** | Reject + Approve | `impact === "time"` → current user `_id` is in `approvers[].user[].user`. `impact !== "time"` → `approverStatus === "pending"` |
| **Vendor / Admin / ViewOnly** | none | — |

Identity match: `useUser()` from `@/store/authSlice` (already the precedent in [NcrTable.tsx:168](src/pages/ContractManagementPage/components/NcrTable.tsx#L168)).

### Impact column

Port MSA's helper verbatim (user explicitly endorsed the format):
```ts
const formatImpact = (item: ContractClaimDTO) => {
  const hasTime = typeof item.time === "number" && Number.isFinite(item.time);
  const hasCost = typeof item.cost === "number" && Number.isFinite(item.cost);
  if (hasTime && hasCost) return `$${(item.cost || 0) / 1000000}M + ${item.time} days`;
  if (hasTime) return `${item.time} days`;
  if (hasCost) return `$${(item.cost || 0) / 1000000}M`;
  return "-";
};
```

### MSA parity

- MSA's claim approval surface is [MSAClaimDetailsSheet.tsx](src/pages/MsaPage/components/MSAClaimDetailsSheet.tsx) — verified no approve / reject / send-approval action exists today (only `addCommentMutation`). No gating change needed.
- MSA's ClaimsTable lives inline in [Claims.tsx](src/pages/MsaPage/layouts/Claims.tsx) and already uses `formatImpact`. No change needed.

## Files to touch

1. **[src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx](src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx)** — import `useUser`, compute `approverInList`, refactor the footer gating to branch on `isClaim`.
2. **[src/pages/ContractManagementPage/components/ClaimsTable.tsx](src/pages/ContractManagementPage/components/ClaimsTable.tsx)** — replace the inline impact-column cell with a `formatImpact` helper.

## Out of scope

- Wiring the "Send for Approval" backend mutation (the `SendApprovalDialog` is a placeholder — no `/approve` POST is wired through it today; gating its visibility is all that's asked).
- Non-claim (change) flow — gating unchanged for changes.
- MSA changes — confirmed no parity edits needed.

## Verification

- `npx tsc -b` exit 0.
- Manual review of the four role × impact × approverStatus combinations against the decision table.
