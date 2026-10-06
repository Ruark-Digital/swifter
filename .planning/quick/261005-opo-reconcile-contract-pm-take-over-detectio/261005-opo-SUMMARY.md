---
quick_id: 261005-opo
slug: reconcile-contract-pm-take-over-detectio
date: 2026-10-05
status: complete
commit: 8bb6528da
---

# Summary — Reconcile Contract PM take-over detection to `pendingProjectManager`

## What changed

BE deployed the QA #78 PM-assignment endpoints (previously BE-blocked) and dropped
`FE_IMPLEMENTATION_GUIDE_PM_ASSIGNMENT.md`. The vendor assign-by-id and CM approval
endpoints were already wired/tested; the only live gap was a **response-shape drift**:
the deployed BE returns the pending take-over in a dedicated `pendingProjectManager`
object with `projectManager` null until the CM approves, whereas the FE detected it via
`projectManager.status === "pending"`. Against the deployed shape the CM action card
never rendered.

- `src/types.ts` — added `PendingProjectManager` interface + optional
  `pendingProjectManager?` on `ContractDetail`.
- `src/pages/ContractManagementPage/pmTakeover.ts` (new) — pure
  `resolvePendingPmTakeover(contract)` helper: pending from `pendingProjectManager`
  (new) with legacy `projectManager.status === "pending"` fallback; requester name
  resolved from a populated object (nested `user.user.name` or `user.name`),
  `undefined` for a bare ObjectId string.
- `src/pages/ContractManagementPage/ContractDetailPage.tsx` — replaced the inline
  `takeOverPending` / `takeOverRequesterName` derivation with the helper. Approval
  payload (`{action, reason}`) and the PM-accepts-contract flow untouched.
- Tests — `pmTakeover.unit.spec.ts` (new, 6 vitest cases); extended
  `qa78-takeover-approval.spec.ts` with a deployed-shape Playwright scenario.

## Verification

- `npx vitest run .../pmTakeover.unit.spec.ts` → 6/6 pass.
- `npx tsc -b` → exit 0 (Vercel build gate).
- `eslint` on all changed files (`--max-warnings 0`) → clean.
- Legacy take-over Playwright scenario preserved (covered by the fallback path).

## Commit

- `8bb6528da` fix(contract): detect PM take-over from deployed pendingProjectManager shape

## Follow-ups (out of scope, deferred per user)

- Triage items 115 / 116 / 135 and the deployed "user route api" from BE's WhatsApp
  notes — no in-repo ticket mapping yet; awaiting the tracker/mapping from the user.
