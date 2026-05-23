---
status: complete
date: 2026-05-23
slug: approver-change-stats-binding
---

# Quick task 260523 — Approver Change Management stats binding

## Why
Even after `0f9cc78d1` added `stats?.completed`/`stats?.cancelled`
fallbacks to ChangeStatsCards, the approver Change Management page
still rendered All=0/Approved=0/Pending=0/Rejected=0. User reported
"the stats does not seem to be fixed".

## Root cause
The render block in `ChangeTabContent.tsx` was unwrapping the response
inline with an ambiguous IIFE:

```ts
const stats = (statsRes as any)?.data?.data ?? (statsRes as any)?.data;
```

This was designed to be flexible across response shapes, but in
practice it made the actual data flow opaque — if the queryFn ever
returned anything other than the expected single-wrap envelope, the
unwrap silently returned undefined and the cards rendered zeros.

## Fix
- Push the unwrap **into the queryFn** so the query returns the
  `ContractChangeStatsDTO` object directly. No more inline IIFE in the
  render block.
- Strongly type the queryFn return so future drift is caught at compile
  time.
- Render block now reads `stats` directly from `useQuery`.

## File
`src/pages/ContractManagementPage/layouts/ChangeTabContent.tsx`
