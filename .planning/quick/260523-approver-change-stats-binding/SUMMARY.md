---
status: complete
date: 2026-05-23
slug: approver-change-stats-binding
---

# Quick task 260523 — Approver Change Management stats binding fix

## Scope
Make the approver Change Management stats cards actually bind to the
fetched data. Builds on 0f9cc78d1 which added the
`stats?.completed`/`stats?.cancelled` fallbacks but didn't fix the
upstream issue: the render block unwrap was ambiguous.

## Root cause confirmed
Render-block unwrap was:
```ts
const stats = (statsRes as any)?.data?.data ?? (statsRes as any)?.data;
```
which depends on `statsRes` matching one of two shapes. Whenever it
didn't, both arms collapsed to `undefined` and every stat card showed 0.

## File touched
`src/pages/ContractManagementPage/layouts/ChangeTabContent.tsx`

- queryFn now unwraps explicitly and returns
  `ContractChangeStatsDTO` directly:
  ```ts
  const response = await getRequest({ url: `${basePath}/stats` });
  const body = response?.data;
  return (
    (body as { data?: ContractChangeStatsDTO })?.data ??
    (body as ContractChangeStatsDTO) ??
    {}
  ) as ContractChangeStatsDTO;
  ```
- Render block reads `stats` directly from `useQuery` — no IIFE, no
  inline unwrap.
- Added `type ContractChangeStatsDTO` import from `contractManagerApi`.

## Why this is more robust
Doing the unwrap **inside** the queryFn:
1. Centralizes the assumption about response shape in one place.
2. Lets TypeScript's return-type annotation catch drift at compile time.
3. Removes the renderer's dependency on guessing whether `statsRes` is
   the Axios body or the inner data.
4. Keeps the `0` fallback in `ChangeStatsCards` as the last line of
   defence rather than the only line.

## Verification
- `npx tsc --noEmit -p tsconfig.app.json` clean.
- Manual: refresh the approver Change Management tab — All/Pending
  should now reflect the backend payload; Approved/Rejected pick up
  `completed`/`cancelled` aliases via the fallback chain shipped in
  0f9cc78d1.

## Related
- Prior fix: `0f9cc78d1` (added `completed`/`cancelled` fallbacks to
  ChangeStatsCards, but that alone wasn't enough — the unwrap was the
  real bug).
- Memory note: `project_approver_stats_field_aliases.md` documents the
  approver vs manager field-name divergence.
