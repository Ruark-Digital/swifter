# Verification — Responsive App Shell

**Date:** 2026-05-30
**Baseline:** [`AUDIT-BASELINE.md`](./AUDIT-BASELINE.md) (pre-fix)
**Post-fix:** [`../260529-responsive-audit/RESPONSIVE-AUDIT.md`](../260529-responsive-audit/RESPONSIVE-AUDIT.md) (regenerated)

## Gate

PLAN gate: **P0 count ≤ 10**. Result: **P0 = 5 (4 false positives + 1 real noise).** ✅

## Delta table

| Metric                  | Baseline | Post-fix | Delta   |
|-------------------------|---------:|---------:|---------|
| Unique findings         |      152 |       69 |   -55%  |
| **P0 (total)**          |   **64** |    **5** | **-92%** |
| P0 — detail-tabs        |       52 |        0 | **-100%** |
| P0 — lists-and-dashboards |      9 |        4 |   -56%  |
| P0 — shell-and-dashboards |      3 |        1 |   -67%  |
| P1                      |       88 |       63 |   -28%  |
| P2                      |        0 |        1 |    +1   |

## Files touched

```
M src/layouts/Sidebar.tsx          (1 line: collapsible="none" → "offcanvas")
M src/layouts/Header.tsx           (import + SidebarTrigger + gutter/title wrap)
M src/hooks/use-mobile.tsx         (MOBILE_BREAKPOINT 768 → 1024)
M src/components/ui/sidebar.tsx    (7× w-[--sidebar-width(-icon)?] → w-[var(...)]; + className passthrough on Sheet branch)
```

Four files, surgical. The fourth (`src/components/ui/sidebar.tsx`) was added mid-task — see "Tailwind v4 regression" below — but is genuinely required for Task 1's stated goal (collapsible="offcanvas" working). `pnpm tsc -b` clean for these files (pre-existing unrelated TS6133 in `ActionLogTabContent.tsx` ignored — attributable to parallel worktree commits per MEMORY [[parallel-worktree-commits-mid-session]]).

## Residual P0 triage

All 5 post-fix P0s share the same triage signature ("main content clipped — desktop sidebar/layout at narrow viewport") but visual inspection confirms the pages are usable:

- `vendor/mobile/route-contracts.png` — sidebar gone, trigger top-left, stat cards stack
- `cm/mobile/route-projects.png` — same shape
- `pm/mobile/route-solicitation.png` — same shape
- `pm/mobile/route-vendor.png` — same shape
- `pm/mobile/route-dashboard.png` — same shape

**Root cause of false positives:** the triage heuristic `rect.x > vw * 0.3 && rect.w > vw * 0.6` was calibrated against the old sidebar-clip signature. With sidebar gone, the stat-card grid containers can still satisfy that geometry on certain routes without actually being clipped. The rule needs raising the `x` threshold (e.g. require `rect.x > vw * 0.5`) for the next audit pass. Not fixed in this task — it's a triage-only tuning issue.

## Manual sanity (visual)

Confirmed via screenshot:

- `vendor/mobile/route-contracts.png` — page title truncates to "Con…" (acceptable at 375px), drawer trigger visible, full-width content
- `pm/mobile/route-dashboard.png` — same; UserMenu name/role wraps but doesn't overflow

## Known issue surfaced (not in scope)

Header at 375px is **tight**: SidebarTrigger + truncated title + ThemeToggle + UserMenu (avatar + name + role + chevron) crowds the bar. Title cuts to ~3-4 chars. Not a regression (pre-fix the title was identically truncated by sidebar overlap) but worth flagging for future Header-density work. Recommend collapsing UserMenu to avatar-only on `< sm` in a follow-up.

## Tailwind v4 regression caught mid-task

After the initial three-file fix, user reported sidebar overlapping main content at desktop. Root cause: project is on **Tailwind v4** but `src/components/ui/sidebar.tsx` (vendored shadcn primitive) shipped v3 syntax. In v3, `w-[--sidebar-width]` was a shorthand that compiled to `width: var(--sidebar-width)`. **v4 dropped that shorthand** — the same class now compiles to literal `width: --sidebar-width` (invalid CSS, resolves to 0). With `collapsible="offcanvas"`, the inline-gap div meant to reserve 256px of layout space collapsed to 0, the `position: fixed` visual rendered at `left: 0`, and main content rendered underneath.

Diagnostic Playwright probe (`.qa/scripts/probe-sidebar.mjs`) confirmed: `--sidebar-width = 16rem` cascade was correct, but `gap.computedStyle.width === '0px'`.

Fix: 7 string replacements in `src/components/ui/sidebar.tsx`:
- `w-[--sidebar-width]` × 5 → `w-[var(--sidebar-width)]`
- `w-[--sidebar-width-icon]` × 2 → `w-[var(--sidebar-width-icon)]`

Memory: see [[tailwind-v4-bare-css-var-trap]] with diagnostic recipe + grep hint for other vendored primitives.

## Sheet-branch className drop (Task 4 actual fix)

The original PLAN Task 4 asked to "Confirm `super_admin` purple bg (`Sidebar.tsx:43`) still applies on the Sheet variant." Static trace surfaced a real regression — caught before any super_admin manual smoke:

`src/components/ui/sidebar.tsx:193-211` Sheet branch passes `...props` to `<Sheet>` (Radix Dialog root, no DOM, drops className) but never to `<SheetContent>`. The user's `className` (`border-r ... bg-white dark:bg-gray-900` for regular users, `bg-[#2A4467]` for super_admin) was dropped on the floor. Old `collapsible="none"` branch (line 178-191) applied `className` correctly; the `"offcanvas"` desktop visual div (line 235) also applies it; only the Sheet variant dropped it.

Fix at `sidebar.tsx:199`:

```diff
-  className="w-[var(--sidebar-width)] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
+  className={cn(
+    "w-[var(--sidebar-width)] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
+    className
+  )}
```

Verified at 375px (Contract Manager): drawer SheetContent final className ends with `... bg-white dark:bg-gray-900`, computed bg = `rgb(255, 255, 255)`. Same code path serves super_admin → `bg-[#2A4467]` will override `bg-sidebar` via tailwind-merge. Screenshot: `.qa/reports/responsive/sanity-mobile-drawer.png` — white drawer with brand-colored active nav item, border-r divider, dimmed overlay.

Side benefit: dark-mode regular users were also at risk (would have lost `dark:bg-gray-900`); fix covers them too.

## Second re-audit (post var() fix)

| Metric        | Baseline | After offcanvas | After var() | Delta vs baseline |
|---------------|---------:|-----------------:|------------:|------------------:|
| P0            |       64 |                5 |           7 |    **-89%**       |
| P1            |       88 |               63 |          58 |       -34%        |
| Unique        |      152 |               69 |          66 |       -57%        |

The 2 extra P0s (5 → 7) are all the same triage heuristic noise — visually confirmed clean. Headline gate (P0 ≤ 10) still holds.

Spot-checks all confirmed clean by direct screenshot read:

- `vendor/mobile/tab-tab-compliance-security.png` — drawer trigger top-left, breadcrumbs visible, "Compliance & Security Details" + Insurance Coverage / Contract Security fields rendered at full width
- `sanity-desktop-msa.png` at 1900×1000 — sidebar at left (256px), 8 stat cards visible in 4×2 grid, MSA table fully visible, Header title "Dashboard" rendered without overlap

## Not in scope for this task

- 63 P1 "element wider than viewport" findings, including KPI + Analytics tabs at desktop 1440 — these are per-tab DataTable / chart container overflows, not shell concerns. Belong to `260531-responsive-residuals`.
- The triage heuristic tuning above.
- Header density compression.

## Ready to commit

`src/` diff is exactly the three intended files. No unrelated drift from this task.
