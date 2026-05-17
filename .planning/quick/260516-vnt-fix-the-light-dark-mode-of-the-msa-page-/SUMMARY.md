---
status: complete
date: 2026-05-16
slug: fix-the-light-dark-mode-of-the-msa-page-
---

# Quick task 260516-vnt — Fix light/dark mode on MSA list + detail

## Scope
Apply the established Contract Management dark-mode palette (see `~/.claude/projects/.../memory/project_contract_dark_mode_patterns.md`) to the MSA list page and the MSA detail page so labels, stats, tables, and tabs render correctly under `dark` class.

## Files touched
- `src/pages/MsaPage/index.tsx` — `MSA` heading + inner Tabs strip `data-[state=active]` triggers gain `dark:text-slate-400` for inactive state.
- `src/pages/MsaPage/components/StatsCards.tsx` — Card border/bg, title, value, all four tone wraps (gray/green/red/yellow) and inner icon halo get dark variants.
- `src/pages/MsaPage/components/EmptyState.tsx` — Icon, "No MSA Yet" heading, helper text → `dark:text-slate-{300,400,500}`.
- `src/pages/MsaPage/components/MsaTable.tsx` — Header label, column cell renderers (title/code/value/dates), status badge tone palette, and full `classNames` block on the underlying DataTable.
- `src/pages/MsaPage/components/LabelItem.tsx` — Single shared component used by every Overview field; one edit fixes Contract Name / MSA ID / MSA Type / Deviation Scale / Business Division / Published Date / Effective Date / End Date / Draft/Review/Approval/Execution Duration / Contract Manager / Status / Description labels at once.
- `src/pages/MsaPage/layouts/Overview.tsx` — "Contract Team" heading and the two stakeholder sub-labels; N/A fallbacks.

## Pattern reused
- Slate-900/800 card bgs + slate-800 borders
- `dark:bg-*-900/30` tinted icon wraps
- Status badges: `bg-*-100 text-*-700 → dark:bg-*-900/40 dark:text-*-300`
- DataTable `classNames` block (container/tHeader/tHeadRow/tBody/tRow/tHead/tCell)
- shadcn `TabsTrigger` inactive: explicit `dark:text-slate-400`

## Verification
- `npx tsc --noEmit` clean
- No runtime changes — purely Tailwind class additions
